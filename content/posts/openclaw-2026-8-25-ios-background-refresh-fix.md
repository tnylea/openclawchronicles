---
title: "OpenClaw Fixes iOS Background Refresh Completion"
excerpt: "OpenClaw's iOS app now settles expired background refreshes exactly once, preventing stale wake work from reporting false success."
coverImage: '/assets/images/posts/openclaw-2026-8-25-ios-background-refresh-fix.png'
date: '2026-08-25T08:02:00.000Z'
dateFormatted: August 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-25-ios-background-refresh-fix.png'
---

OpenClaw's iOS app picked up a high-priority reliability fix this morning with [PR #129097](https://github.com/openclaw/openclaw/pull/129097), a small but important repair to background refresh handling. The merged change makes each iOS background-refresh delivery settle exactly once, even when the refresh expires, gets replaced, or races with a late completion.

That matters because background refresh is one of the invisible pieces of a mobile agent experience. When it works, the app can wake up, reconnect, and persist state without asking the user to babysit it. When it races, operators see confusing behavior: stale work may look successful, cancelled refreshes may mutate state late, or a background delivery may be completed in a way that no longer reflects the actual task.

## What Changed

The PR gives every background-refresh delivery a lock-protected settlement owner. In plain terms, the refresh now has one authority responsible for deciding whether the delivery finished, expired, or was replaced.

The change specifically:

- Cancels outstanding work when the BackgroundTasks expiration callback fires.
- Completes the exact expired delivery unsuccessfully, once.
- Rejects stale completion from a previous delivery.
- Stops cancelled wake work before reconnect mutations or successful background-beacon persistence.

The PR describes the old root cause clearly: the app retained only the child Swift task. Expiration cancelled that child, but a separate waiter could still publish an earlier `true` result to `BGTask.setTaskCompleted`. Replacement had a similar shape, cancelling the child without settling its own framework task.

## Why It Matters

Apple's BackgroundTasks contract expects expiration handlers to cancel outstanding work, clean up, and complete the delivery. OpenClaw's fix moves that responsibility into a delivery-scoped owner instead of leaving multiple async paths able to speak for the same refresh.

For users, the benefit is mostly absence: fewer phantom successes, fewer stale reconnect attempts, and a cleaner boundary between a real completed refresh and a cancelled one. For maintainers, the fix also makes future lifecycle bugs easier to reason about because the delivery has a single settlement point.

## Test Coverage

The validation included a fail-before and pass-after run on an actual iPhone simulator. According to the PR, the new cancelled-refresh regression failed before the repair while 237 existing tests passed. After the fix, all 241 `NodeAppModelInvokeTests` passed, including the new settlement-ordering cases.

The merged patch is compact: production changes were reported at +53/-8 lines, with +55 lines of tests. That is the right shape for a lifecycle bug like this: a narrow owner-boundary repair, backed by regressions for expiration-before-completion, completion-before-expiration, replacement, and the cancelled/throttled refresh path.

OpenClaw mobile users will not see a new button or setting from this change. They should see something better: background refreshes that tell the truth.
