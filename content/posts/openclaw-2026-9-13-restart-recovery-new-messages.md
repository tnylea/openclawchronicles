---
title: "OpenClaw Resumes Work After Restarts"
excerpt: "OpenClaw now resumes interrupted agent work after Gateway restarts before admitting new messages into the session."
coverImage: '/assets/images/posts/openclaw-2026-9-13-restart-recovery-new-messages.png'
date: '2026-09-13T23:00:00.000Z'
dateFormatted: September 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-13-restart-recovery-new-messages.png'
---

OpenClaw merged a high-priority Gateway reliability fix tonight in [PR #147486](https://github.com/openclaw/openclaw/pull/147486), `fix: resume interrupted work when new messages arrive after restart`. The change targets a frustrating failure mode: an interrupted task could get stuck after a Gateway restart if a new message arrived before the recovery owner adopted the saved run.

For users, the desired behavior is simple. A restart should not silently cancel work that was already in progress, and a follow-up message should not strand the original turn. This PR makes that recovery path more explicit.

## What Changed

The bug lived in the handoff between prompt preparation, durable restart state, and new foreground messages. The PR says prompt preparation was clearing the interruption flag too early. If a later claim conflict happened, OpenClaw could lose the recovery state while leaving behind an old delivery claim.

The fix keeps durable restart state with the recovery owner and routes foreground admission through the existing recovery path before taking ownership of new work. That gives the interrupted turn a chance to continue from saved context, while new user messages use the follow-up queue already designed for that session.

The user-facing contract is cleaner:

- Interrupted work resumes from its saved context.
- New messages are queued as follow-ups while recovery owns the session.
- The agent is told the restart did not cancel the task.
- The agent should reconcile current state and uncertain tool outcomes.
- Existing delivery authority, permissions, reset behavior, and tombstones are preserved.

That last set of boundaries matters. Recovery is powerful because it touches work that may have already called tools, produced files, or interacted with delivery state. The PR keeps the repair inside the existing authority model rather than adding a new shortcut around it.

## Why It Matters

Restart recovery is one of those features that users only notice when it fails. Long-running OpenClaw work can include builds, research, file edits, deployments, or background tool calls. If the Gateway restarts in the middle and the user sends another message afterward, the system needs to continue without asking the user to reconstruct the whole situation.

This fix also helps preserve conversational trust. A user should not need to know which internal owner currently holds a session lease. They should be able to see the agent pick up the thread, inspect what happened, and keep going.

## Verification

The PR reports that the lost-continuation regression was reproduced against the original code using isolated SQLite and then passed with the fix. It also passed 461 focused tests across session hints, turn admission, recovery claims, reply context, and startup recovery, followed by a final 57-test rerun.

Full build, production and test type checks, targeted lint, formatting, and repository guards also passed. Independent review found no actionable P0-P2 findings.

The remaining caveat is scope: the recovery admission tests use real session leases and handoffs with a mocked recovery dispatch boundary, but the PR does not claim a new live restart deployment proof. Even so, this is a meaningful stability improvement for anyone relying on OpenClaw to finish work across messy runtime conditions.
