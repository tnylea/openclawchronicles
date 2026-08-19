---
title: "OpenClaw Matrix Providers Recover After Sync Stops"
excerpt: "OpenClaw Matrix providers now recover from disconnected sync-stop poison without replacing the whole Gateway process."
coverImage: '/assets/images/posts/openclaw-2026-8-19-matrix-provider-recovery.png'
date: '2026-08-19T23:01:00.000Z'
dateFormatted: August 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-19-matrix-provider-recovery.png'
---

OpenClaw merged a Matrix availability fix in [PR #125362](https://github.com/openclaw/openclaw/pull/125362), addressing a failure mode where Matrix accounts could stay disconnected until the entire Gateway process was replaced.

The bug sat at the intersection of OpenClaw's provider restart logic and the pinned `matrix-js-sdk` classic sync implementation. When sync was parked in a disconnected keepalive path, `SyncApi.stop()` could fence the path without emitting the later `STOPPED` event OpenClaw was waiting for. OpenClaw timed out after five seconds, then retained the resulting poison error in shared client state.

After that, every auto-restart could replay the stale error immediately instead of creating a fresh Matrix client. In a real six-account deployment described in the PR, Synapse and nginx had recovered, but all six OpenClaw Matrix accounts remained stopped and disconnected inside the Gateway process.

## What Changed

The patch makes OpenClaw match the exact pinned SDK contract while preserving fail-closed cursor behavior.

For SDK `ERROR` and `RECONNECTING` states, OpenClaw now captures the parked keepalive resolver before stopping classic sync. It then settles without waiting for `STOPPED` only if the same resolver is still installed, clearing and rejecting it with the SDK's own terminal reason so the parked task can unwind.

That condition is intentionally narrow. If there is no resolver, if active sync is still ambiguous, or if the resolver was replaced during stop, OpenClaw keeps the existing real-`STOPPED` wait and five-second fail-closed timeout.

The other key change is cleanup after poison. Once a failed generation has drained leases and stopped without persisting an untrusted cursor, OpenClaw evicts it from the shared-client registry. The current caller still gets the original error, but a later retry can create a genuinely fresh client.

## Why It Matters

Matrix is a long-running channel integration. It is expected to survive ordinary network and homeserver turbulence without forcing operators to restart the whole Gateway.

Before this fix, a single disconnected health-monitor restart could leave a Matrix provider permanently stuck for the lifetime of the process. That is especially painful for multi-account deployments because a recovered homeserver still would not restore the OpenClaw side of the connection.

The fix keeps the safety posture intact: uncertain cursor state is still discarded, failed generations stay failed, and future SDK changes fail closed behind the exact version assertion. What changes is that one poisoned generation no longer contaminates future provider acquisition.

## Evidence From The PR

The PR includes source-level proof against the pinned `matrix-js-sdk` 41.9.0 contract and production evidence from a six-account deployment.

Regression tests covered parked `ERROR` and `RECONNECTING`, stale `ERROR` without a resolver, active `SYNCING`, resolver replacement during stop, double quiescence, permanent rejection memoization after cursor discard, and fresh acquisition after poisoned retirement.

Validation included 163 focused Matrix SDK and shared-client tests, the full Matrix extension suite with 1,931 passing tests, and a passing build.

Production follow-up showed all six Matrix accounts entering a real disconnected health-monitor restart, then acquiring fresh provider generations in 149-445 ms and logging back in without replacing the Gateway process.
