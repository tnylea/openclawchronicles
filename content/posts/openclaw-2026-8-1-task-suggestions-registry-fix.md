---
title: "OpenClaw Preserves Gateway Task Suggestions"
excerpt: "OpenClaw PR #117623 keeps accepted Gateway task suggestions recoverable when the suggestion registry reaches capacity."
coverImage: '/assets/images/posts/openclaw-2026-8-1-task-suggestions-registry-fix.png'
date: '2026-08-01T23:01:00.000Z'
dateFormatted: August 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-1-task-suggestions-registry-fix.png'
---

OpenClaw merged a P1 Gateway reliability fix tonight with [PR #117623, "fix(gateway): preserve task suggestions when the registry is full"](https://github.com/openclaw/openclaw/pull/117623). The patch targets a subtle failure in the follow-up task workflow: accepted suggestions could lose their original managed-session key when the suggestion registry hit capacity.

That sounds like an edge case until you consider how operators use task suggestions. A Gateway suggestion is not just a transient UI row. Once accepted, it becomes a bridge back to the managed session OpenClaw created for the follow-up work. Losing that key means a retry or replay can point at missing state even though the user already accepted the work.

The PR also closes a second unsafe behavior. An oversized suggestion that could never fit in the retained registry could still mutate existing accepted or visible pending state before admission failed. That is the wrong order for a bounded store: the system should know whether a new record can fit before it discards useful work.

## What Changed

The fix refactors the Gateway suggestion registry around an atomic admission planner. Instead of evicting opportunistically while trying to make space, OpenClaw now calculates a feasible plan first, including the existing 100-record bound and the exact retained UTF-8 JSON byte budget.

Eviction priority is now explicit:

- dismissed suggestions go first
- pending suggestions go next
- accepted suggestions are reclaimed only as the final bounded-capacity fallback
- entries currently being accepted are never evicted

That last rule is the important race guard. If a user is in the middle of accepting a suggestion, the registry cannot pull the record out from under the operation just because another suggestion arrives.

The PR keeps the behavior private to the Gateway owner. It does not add a new protocol, schema, plugin SDK surface, public configuration option, or migration. The production change is only 10 net lines, but it clarifies the core invariant: failed admission must not damage existing suggestion state.

## Why It Matters

Task suggestions sit right where automation turns into user-directed work. Operators need to trust that clicking accept creates durable, retryable follow-up work, not a best-effort handoff that disappears under queue pressure.

The new policy also avoids a trap in the opposite direction. Keeping every accepted suggestion forever would protect old keys, but it would eventually fill the registry after 100 completed tasks and block future suggestions. By allowing old accepted replay entries to be silently reclaimed only when necessary, OpenClaw keeps the feature moving without sacrificing in-flight work or recent accepted state.

## Evidence

The PR includes a regression-first test against the untouched parent. Two real failures reproduced the issue: one Gateway handler lost accepted-session replay during pending pressure, and another removed accepted state while rejecting an impossible multibyte admission.

The final owner suite passed 14 of 14 tests, including 100 real `taskSuggestions.accept` operations and successful admission of the 101st suggestion. Coverage also checks the original accepted session-key retry after pending expiration, all-accepting retryable rejection, byte-bound enforcement, and rollback behavior.

For users, the outcome is simple: accepted OpenClaw task suggestions should keep pointing to the session they created, even when the registry is busy.
