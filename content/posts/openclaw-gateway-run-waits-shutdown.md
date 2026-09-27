---
title: "OpenClaw Gateway Stops Long Wait Shutdown Delays"
excerpt: "OpenClaw Gateway now cancels disconnected observation waits during graceful shutdown, preventing long-poll reads from consuming restart drain time."
coverImage: '/assets/images/posts/openclaw-gateway-run-waits-shutdown.png'
date: '2026-09-27T23:00:00.000Z'
dateFormatted: September 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-gateway-run-waits-shutdown.png'
---

OpenClaw merged a P1 Gateway availability fix late Sunday that targets a deceptively simple shutdown problem: read-only waits could keep a graceful stop open for far too long after the requesting client had already gone away.

The change landed in [PR #159699](https://github.com/openclaw/openclaw/pull/159699), titled `fix(gateway): stop run waits from blocking graceful shutdown`. The pull request says the bug could make a graceful Gateway stop spend its full 315-second drain budget on a read-only `agent.wait`, even after the client disconnected.

## What Changed

The fix gives observation-style methods their own lifetime semantics. In practice, that means long-poll requests are tied to the connection that asked for them, rather than to the Gateway process itself.

The PR calls out several wait paths covered by the change:

- `agent.wait`
- exec and plugin approval decision waits
- `question.waitAnswer`
- `device.scopes.waitUpgrade`

Disconnected clients now release their waits. Connected clients get a retryable restart error quickly, which lets them reconnect and wait again after the Gateway comes back.

Importantly, the pull request says actual runs and admitted writes keep their existing drain and settlement behavior. That distinction matters because OpenClaw needs to cancel passive observation without abandoning mutations or shared results that have their own ownership.

## Why It Matters

Gateway shutdown behavior sits directly in the operator experience. If a restart gets stuck behind a long-poll read, an update, config reload, or maintenance action can feel broken even when the underlying work is healthy.

This fix narrows that risk. The requesting connection now owns its observation scope, so a closed socket can retire its waiter instead of leaving root admission occupied until a timeout expires.

The update also preserves the existing pre-signal safe-restart and Linux short-budget maintenance behavior. There is no protocol or storage schema change.

Operators should note the update caveat: this behavior only appears once the running Gateway already contains the fix. Installing the new files cannot change how an older currently running Gateway drains, so the first update from an older process may still encounter the previous delay.

## Evidence From The PR

The before reproduction retained a root request after the client was killed and logged a 315-second stop drain. After the change, the PR reports an isolated Gateway exited cleanly once the waiting client was killed, and a connected client received a retryable restart error 24 ms after SIGTERM in another case.

That is the useful shape of the fix: disconnected observers disappear, connected observers get a clear reconnect path, and Gateway shutdown can complete without waiting for unrelated read-only polls to age out.

For teams running OpenClaw as a long-lived local service or shared Gateway, this is not a flashy feature. It is the kind of availability repair that makes routine restarts much less mysterious.
