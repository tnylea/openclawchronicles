---
title: "OpenClaw Fails Readiness on Integrity Loss"
excerpt: "OpenClaw now returns failed Gateway readiness when shared-state integrity loss prevents new work from being safely admitted."
coverImage: '/assets/images/posts/openclaw-2026-9-23-readiness-integrity-loss.png'
date: '2026-09-23T23:00:00.000Z'
dateFormatted: September 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-23-readiness-integrity-loss.png'
---

OpenClaw merged a P0 Gateway readiness fix tonight that changes how the system reports a damaged shared-state store. [PR #156700](https://github.com/openclaw/openclaw/pull/156700) makes `/ready` and `/readyz` return HTTP 503 when a SQLite worker records terminal shared-state integrity loss and can no longer admit work.

That distinction matters for operators. A Gateway can still be alive at the HTTP process level while being unsafe or unable to accept new state-backed work. The fix keeps `/healthz` as the liveness signal, but pushes admission failure into readiness where supervisors and load balancers are expected to look.

## What Changed

Before this patch, a worker-local admission failure could reach the parent process as a rejected operation while readiness still leaned on cached channel health. The PR summary says the old failure mode was a Gateway that could keep reporting ready after integrity loss made admission impossible.

The new path publishes the terminal refusal through the parent readiness latch. That means the readiness endpoint checks the recorded failure before trusting cached channel status. It also protects replacement database generations from stale worker replies, so an old failure cannot incorrectly poison a newer generation.

For local or authenticated callers, OpenClaw can expose the recorded reason. For external probes, the practical signal is simpler: readiness flips to unavailable instead of advertising an instance that should not take traffic.

## Why Operators Should Notice

This is not a cosmetic probe tweak. OpenClaw deployments often sit behind process supervisors, health checks, or orchestrators that make routing and restart decisions from `/readyz`. Returning HTTP 200 after terminal admission failure can make the surrounding infrastructure believe an instance is eligible for more work.

With the new behavior, the surrounding system gets a much cleaner contract:

- `/healthz` continues to say whether the Gateway process is alive.
- `/readyz` says whether the Gateway can safely admit work.
- Shared-state integrity loss becomes an immediate readiness failure.
- Doctor repair remains a separate explicit step, not an automatic hidden mutation.

That separation is the right one. A system that cannot safely admit state-backed work should stop receiving work before the operator decides whether repair is possible.

## Evidence and Scope

The PR includes a real-worker regression with a physically corrupted audit UNIQUE index and the actual HTTP probe handler. The maintainer notes say disabling the new publication path reproduced the incorrect HTTP 200 response, while the fixed path returns HTTP 503.

The change is also intentionally bounded. The production delta is small for a P0: readiness and failure publication are owned here, while schema changes, dependency changes, and automatic Doctor repair are out of scope.

For OpenClaw admins, the takeaway is straightforward: after this merge, readiness is a sharper signal. Supervisors should monitor `/readyz` for admission health and keep treating `/healthz` as process liveness.
