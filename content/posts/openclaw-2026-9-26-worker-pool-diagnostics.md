---
title: "OpenClaw Adds Worker Pool Diagnostics"
excerpt: "OpenClaw diagnostics.lanes now reports live JavaScript Worker counts per pool, improving Gateway thread investigations."
coverImage: '/assets/images/posts/openclaw-2026-9-26-worker-pool-diagnostics.png'
date: '2026-09-26T08:03:00.000Z'
dateFormatted: September 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-26-worker-pool-diagnostics.png'
---

OpenClaw's Gateway diagnostics gained a sharper lens this morning. [PR #158561](https://github.com/openclaw/openclaw/pull/158561), titled "fix(diagnostics): expose live Worker counts per pool," updates `diagnostics.lanes` so operators can attribute live JavaScript Worker counts to the pools that own them.

The motivating problem is straightforward: `diagnostics.lanes` did not identify which live Worker pools accounted for the process's Worker count. That made native-thread investigations harder to reason about.

## What Changed

The merged PR adds `workerCount`, `workerPoolCount`, and the 100 largest live `workerPools` to `openclaw gateway call diagnostics.lanes --json`.

Each listed pool includes process-local pool IDs, allowlisted script names, and Worker counts. Pending retirements remain counted until native exit, while empty pools disappear. Direct Workers still contribute to the total even when they do not appear as a pool entry.

The implementation keeps the existing Worker registry as the owner for attribution and cleanup. Weak pool identities avoid retaining pool objects, and the PR explicitly avoids adding a second registry or snapshot cache.

## Why It Matters

Thread and Worker attribution is not the sort of feature most users notice when things are calm. It becomes valuable when a Gateway is under pressure and an operator needs to know whether the process is healthy, stuck, or simply running a lot of legitimate pool work.

This change also draws a useful boundary around what it does not do. Earlier investigation connected retained native threads to DAVE's native Rayon encryption pool, not JavaScript Worker counts. The PR therefore drops a proposed optimization that would have changed the Gateway's Rayon environment.

That restraint matters. The author notes that direct and ordinary brokered child processes inherit the current Gateway environment, so a process-wide one-thread default could accidentally constrain unrelated Rayon-based tooling. The merged change improves observability without changing native pool sizing.

## Documentation Updates

The Discord voice documentation now mentions the native pool and the operator-owned `RAYON_NUM_THREADS` service-environment option, including inheritance by child processes. Prometheus documentation was also touched.

There is no new configuration, dependency, live Gateway restart, or Discord runtime change in this PR.

## Evidence And Limits

The PR's focused proof ran worker-pool, worker-CPU, and Gateway diagnostics tests with 57 passing cases. The two existing diagnostics cases extended with pool assertions cover one reused Worker, cleanup back to the initial snapshot, and three independent pools with counts `[3, 1, 1]`.

The changed gate also passed across the docs and production files named in the PR, and exact-head CI passed with 126 successful jobs, 20 skipped, and zero failures.

The limits are explicit: no live Gateway was changed or restarted, no new live Discord measurement was attempted, and no native-thread or RSS reduction is claimed. A future pool-size option in the native DAVE binding remains separate work.

## The Takeaway

PR #158561 makes OpenClaw's Gateway diagnostics more useful during capacity and thread investigations. It does not try to tune the runtime behind the operator's back; it exposes better facts so the next investigation has fewer blind spots.
