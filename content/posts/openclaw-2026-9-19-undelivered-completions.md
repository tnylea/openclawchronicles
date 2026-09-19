---
title: "OpenClaw Stops Old Completions Blocking New Work"
excerpt: "OpenClaw PR #152537 removes a global delivery-pressure gate so retained suspended completions no longer block fresh work sessions."
coverImage: '/assets/images/posts/openclaw-2026-9-19-undelivered-completions.png'
date: '2026-09-19T08:04:00.000Z'
dateFormatted: September 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-19-undelivered-completions.png'
---

OpenClaw merged [PR #152537](https://github.com/openclaw/openclaw/pull/152537), a P1 agent-runtime fix that keeps old undelivered completions from blocking new work.

The failure mode was blunt: a backlog of 50 suspended completion deliveries could prevent every new `sessions_spawn` request. That included visible work sessions and ACP sessions, so a delivery problem in old results could stop fresh work from starting.

## What Changed

The fix removes the global delivery-pressure admission gate. Suspended results remain inspectable, retryable, and dismissible through their existing retention policy, but they no longer act like a global stop sign for new sessions.

That is the right separation of concerns. Old delivery failures still need visibility and cleanup, but they should not prevent unrelated work from launching.

The PR also repairs a false-suspension path for private child results. Before the fix, private child results could wait for their spawning parent while their individual delivery window quietly expired. When the parent finally settled, OpenClaw could mark the child as suspended even though the system was behaving as designed.

Now, normal parent settlement starts the unused private delivery window at the appropriate time. If the parent yields, the existing batch owns delivery, and individual cleanup does not overwrite that handoff with an expired-delivery failure.

## User Impact

For users, the visible behavior is straightforward: new work can start even when old completion deliveries are stuck.

Authorization and active-run limits still apply. This is not a bypass around normal runtime controls, and it does not replay or discard historical suspended results automatically. It simply prevents stale retained delivery state from blocking new sessions that have their own valid admission path.

That distinction is important for reliability. Operators should be able to investigate a delivery backlog without the entire system becoming hostile to fresh work.

## Evidence From The PR

The PR reports a regression with 53 retained suspended records. Before the fix, native, ACP, and visible launches all failed. After the fix, all three dispatched while preserving every retained record.

It also tested private results held for 31 minutes. The pre-fix path failed on both normal parent settlement and yield; the repaired path completed the correct handoff without suspension.

The evidence list includes 635 focused tests across spawn, cloud, lifecycle, requester settlement, restart restoration, registry, warning, and expiry coverage. The exact-head CI workflow also passed.

## Why It Matters

Agent systems need backpressure. They also need the discipline to scope that backpressure to the thing that is actually overloaded.

PR #152537 narrows the blast radius. A stuck delivery backlog remains a backlog, not a system-wide freeze. For anyone running OpenClaw as a practical work coordinator, that kind of isolation is more than cleanup. It is the difference between a recoverable queue problem and a morning lost to runtime archaeology.

