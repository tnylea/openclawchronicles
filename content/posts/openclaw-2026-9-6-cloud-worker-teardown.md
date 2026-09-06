---
title: "OpenClaw Stops Duplicate Cloud Worker Teardown"
excerpt: "OpenClaw Gateway recovery now avoids duplicate cloud worker Stop calls, shortening failed teardown waits while preserving explicit retry behavior."
coverImage: '/assets/images/posts/openclaw-2026-9-6-cloud-worker-teardown.png'
date: '2026-09-06T23:20:00.000Z'
dateFormatted: September 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-6-cloud-worker-teardown.png'
---

OpenClaw has merged a Gateway recovery fix that removes duplicate cloud-worker teardown work during failed cleanup paths. [PR #140377](https://github.com/openclaw/openclaw/pull/140377), "fix: avoid duplicate cloud worker teardown during recovery," landed on September 6, 2026 at 20:17 UTC.

The issue showed up when Gateway shutdown waited for a second physical cloud-worker Stop after background recovery had already tried to clean up the same lease. If the deletion failed, the duplicate provider work could add tens of seconds to shutdown without producing new evidence.

The PR ties this to cloud-session performance follow-ups and related work in issue #138900.

## What Changed

Background recovery now asks for cleanup through the same environment owner that already manages the first teardown attempt. That owner checks the existing destroy intent under its lock.

If cleanup has already been requested and is not finished, recovery reports the operation as pending instead of invoking the provider again. Explicit Stop and Move operations still keep their retry behavior.

The distinction is important. Automated recovery should not repeat the same physical provider call simply because it revisits the lease, but an operator who explicitly asks for Stop should still get a real retry and a current provider error.

Pending-result recovery also receives the same background service view. A pending deletion is no longer mistaken for successful cleanup, and it cannot release an accepted checkpoint or turn fence prematurely.

## Why It Matters

Cloud worker shutdown sits at the intersection of reliability, cost, and user patience. If a provider cleanup path is slow or failing, repeating it during the same recovery sweep is wasteful. It can hold Gateway shutdown open and make a stuck resource look more confusing than it is.

This PR narrows recovery to one cleanup request per background sweep for failed cleanup. The Gateway still waits for admitted physical cleanup, and an unknown lease is not treated as proof that resources are gone.

That makes the behavior more predictable. Operators see pending cleanup when cleanup is already in flight, while explicit manual actions remain available for deliberate retries.

## Measured Impact

The PR includes a concrete before-and-after probe. Before the fix, a real periodic recovery sweep held an in-flight Stop through SIGINT, then started a second Stop for the same historical task lease. The first took about 47.8 seconds and the duplicate another 36.6 seconds.

Natural Gateway shutdown took 84.738 seconds before the repair, with 84.209 seconds spent in placement reconciliation. After the fix, the matched live periodic-shutdown probe completed in 46.639 seconds and reduced two physical Stops to one.

Provider latency can vary, so the timing is not a universal promise. The stronger proof is the command count: the duplicate Stop was removed while the provider call remained joined.

## Validation

Existing real-service regression cases failed before the repair and passed afterward, including startup and active-sweep cleanup paths plus explicit Stop retry behavior. The PR reports 148 focused and sibling tests covering timed-out but physically live provider work, stale-owner retry, dedicated-node attachment, checkpoint fencing, later successful cleanup, and recovery concurrency.

Later CI surfaced a separate provider timeout race, which the final patch also addressed by preserving the real timeout error through shared HTTP error extraction. Exact-head CI passed 107 jobs with 17 skipped, and the fresh review reported no before-merge findings.

For OpenClaw operators, the practical effect is shorter and clearer Gateway recovery when cloud worker cleanup is already pending: one automated teardown request, explicit manual retries when needed, and no fake success signal from an unresolved lease.
