---
title: "OpenClaw Restores Persistent Cron Session Targets"
excerpt: "OpenClaw fixed a P1 cron regression so current and session-targeted jobs keep persistent session history unless explicitly isolated."
coverImage: '/assets/images/posts/openclaw-2026-7-2-cron-session-persistence.png'
date: '2026-07-02T08:02:00.000Z'
dateFormatted: July 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-2-cron-session-persistence.png'
---

OpenClaw merged [PR #98947, "fix(cron): restore persistent session targets"](https://github.com/openclaw/openclaw/pull/98947) on July 2nd, repairing a P1 regression in how scheduled work chooses its session.

The issue was subtle but important. After the recent detached cron target work, jobs scheduled in `current` or `session:<id>` could unexpectedly run as fresh detached sessions. That meant the cron run no longer had the persistent session history the operator intended it to use.

For ordinary scheduled reminders, that might look like an odd loss of context. For long-running agent workflows, it could be worse: the job could lose the accumulated conversation state that explained why it was running in the first place.

## What Changed

The fix restores OpenClaw's clarified product contract: a cron job normally runs in the session it was created from, while an explicitly `isolated` job asks for a detached fresh session.

That distinction is small in configuration terms, but large in behavior.

The PR says the broken path affected `current` and `session:<id>` targets by treating every agent-turn cron target as detached. The corrected code keeps the canonical persistence path across target resolution, session identity, storage, prompt caching, run-context tests, and user-facing docs.

## Why It Matters

Cron jobs are not just timers in OpenClaw. They can wake agents with context, deliver messages, check systems, resume workflows, or coordinate with other sessions. In that model, the target session is part of the job's identity.

If a job says "run in this session," the operator expects the next execution to see the same history and assumptions. If the job silently becomes detached, the agent may still wake up, but it wakes up without the state that makes the job meaningful.

That is why this landed as a P1 fix with session-state, message-delivery, and availability risk labels. The failure mode was not cosmetic. It affected whether scheduled work could continue in the right operational context.

## The Follow-Up Context

This PR is explicitly a follow-up to [PR #98755](https://github.com/openclaw/openclaw/pull/98755), which added detached session targets for cron runs. That earlier work was useful because operators do need a way to run scheduled jobs away from the source conversation.

The problem was the default becoming too broad. Detached execution should be available when requested, not imposed on session-targeted jobs that depend on history.

PR #98947 narrows the behavior back to the intended contract: persistent by default for session targets, isolated only when requested.

## Documentation and Tests

The PR body says the fix updates the cron target-resolution contract and the related docs so the behavior is visible to users. It also calls out deterministic session-state and shared run-context failures that appeared on exact-head CI after the regression.

That is a useful reminder of how intertwined cron is with the rest of OpenClaw. A scheduling change can touch storage, context, prompts, messages, and channel delivery in one move.

## Bottom Line

This is the kind of cron fix that operators may not notice if everything goes right, but would absolutely notice if it stayed broken.

OpenClaw now preserves persistent session history for `current` and `session:<id>` cron targets again. Detached cron sessions remain available, but they are back where they belong: behind an explicit isolation choice.
