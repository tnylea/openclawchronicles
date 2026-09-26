---
title: "OpenClaw Restores Steering Across Active Turns"
excerpt: "OpenClaw PR #158699 fixes queued corrections, reconnect artifacts, and steering during active conversations without changing user configuration."
coverImage: '/assets/images/posts/openclaw-2026-9-26-steering-queued-active-turns.png'
date: '2026-09-26T23:00:00.000Z'
dateFormatted: September 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-26-steering-queued-active-turns.png'
---

OpenClaw merged [PR #158699](https://github.com/openclaw/openclaw/pull/158699) today, a high-priority fix for one of the most visible forms of agent friction: trying to correct an active conversation and watching that correction get stuck behind older queued work.

The change targets two linked problems. First, corrections could fail to steer the active turn once an earlier message in the queue needed a follow-up. Second, after reconnecting, already-consumed input could still appear above the composer, making the UI look as if OpenClaw had not processed it.

The pull request summarizes the intended user impact plainly: eligible corrections can now steer an active turn even when older input still needs follow-up handling. That matters because steering is one of the main reasons people tolerate long-running agent work. If you spot the agent heading in the wrong direction, the system needs to hear the correction now, not after it finishes the stale queue.

## What Changed

The fix changes how OpenClaw decides whether each incoming correction can be admitted into the active run. A rejected steering attempt no longer poisons later attempts behind the same queue. Each admission makes its own decision, while unresolved admissions still keep their ordering and queue caps.

The patch also preserves source identity more carefully. Command-owned runs now expose their existing execution owner to the same steering and transcript-commit path, and adapted browser requests keep the operator comparison identity they started with. In practice, the same authenticated browser should not suddenly look like a different source just because OpenClaw adapted its request internally.

Automatic compaction also gets a sharper boundary. Steering during compaction now requires a V2 backend that can revalidate authority at final dispatch. A V1 sink is not enough, because it can await after send entry without the same final authority assertion.

## Why It Matters

For everyday users, this is less about internal queues and more about conversational trust. When you type a correction, you expect the currently running agent to account for it if the backend supports that kind of steering.

The bug created a subtle failure mode:

- A previous queued item could force follow-up handling.
- A later correction could be prevented from reaching the active run.
- Reconnects could make consumed input appear pending again.
- The operator could lose confidence in what OpenClaw had actually seen.

The fix preserves the cases where OpenClaw should still queue instead of steer. Explicit model or account changes, permission changes, unsupported input, completed owners, and replaced owners still require a follow-up. The important shift is that one earlier rejection no longer blocks a later eligible correction.

## Evidence Behind The Merge

The PR carried the `P1`, `gateway`, `agents`, `app: web-ui`, and `merge-risk: message-delivery` labels, which fits the blast radius: it touches active conversations, session state, and message routing.

Validation was broad. The final exact-head CI run passed, including the required `openclaw/ci-gate`. The author also reported focused coverage around direct-command steering, ordered steers into promoted follow-ups, backlog and cancellation ordering, fallback identity, receipts, diagnostics, UI reconnect behavior, and pending-input pagination.

The browser reconnect regression was reproduced before the fix and passed afterward. In the fixed flow, consumed messages disappear while genuinely pending attachments remain visible.

## The Bottom Line

This is the kind of OpenClaw reliability fix that users feel immediately even if they never learn the underlying term "steering." Corrections should reach active turns when they are eligible, consumed input should not reappear after reconnect, and compaction should not weaken the authority boundary.

For anyone using OpenClaw in long-running work sessions, PR #158699 makes the conversation loop feel less sticky and more honest about what the agent has actually accepted.
