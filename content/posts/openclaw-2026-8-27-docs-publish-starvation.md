---
title: "OpenClaw Fixes Docs Publish Starvation"
excerpt: "OpenClaw's docs sync now keeps publishing during heavy merge bursts instead of canceling every in-flight mirror update."
coverImage: '/assets/images/posts/openclaw-2026-8-27-docs-publish-starvation.png'
date: '2026-08-27T23:15:00.000Z'
dateFormatted: August 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-27-docs-publish-starvation.png'
---

OpenClaw merged a small but important publishing fix for its documentation pipeline. PR [#131155](https://github.com/openclaw/openclaw/pull/131155) changes the source-to-mirror docs sync so pushes to `main` no longer cancel every in-flight publish job during high merge velocity.

The bug was subtle. The workflow used a per-ref concurrency group with cancellation enabled. Under a steady stream of docs-touching commits, each new push could cancel the current sync before it reached the mirror, while the cancellation itself left no completed successor behind.

## What Went Wrong

The PR describes a live incident on August 27, 2026 between roughly 18:25 and 18:39 UTC. Four consecutive docs-sync runs were cancelled by successor pushes, while the `openclaw/docs` mirror stayed behind the source repository.

That is a classic liveness problem. Every individual cancellation can look normal, especially in a busy repository. Taken together, the cancellations mean the public docs stop advancing until someone notices and manually dispatches the workflow.

For a project like OpenClaw, docs freshness is not cosmetic. New features, security notes, provider behavior, setup paths, and policy changes often land with documentation. If the publish mirror silently freezes, users and operators can read stale guidance while the source repository has already moved on.

## The Fix

The change switches push runs to keep the active docs sync alive instead of canceling it. GitHub's concurrency behavior still collapses bursts by keeping only the newest pending run in the group, so a busy merge window becomes "current run finishes, then the newest queued run publishes."

That gives the pipeline a self-healing shape without adding extra scheduling machinery. Manual `workflow_dispatch` runs already behaved like cancellation was effectively off, so the change is focused on normal pushes to `main`.

The PR also notes that idempotency was checked against the existing commit step. If a run is stale because the mirror already contains a newer source SHA, the guard skips it. If the file sync produces no diff, the commit is a no-op.

## Why It Matters

Documentation mirrors are easy to overlook because they are downstream of the code path. But when docs are part of the product, a stalled mirror is a user-facing outage. It can hide new setup instructions, delay migration guidance, and leave old explanations in front of people evaluating the platform.

This fix also pairs with an earlier mirror-to-R2 repair in the docs repository. Together, the two changes address both halves of the publish path: getting source updates into the docs mirror, then getting mirror updates uploaded to production hosting.

## Verification Notes

The PR cites the live cancelled workflow runs and the stale mirror SHA as the observed failure. Validation included `git diff --check`, changed-file tooling, formatting and guard checks, script lint, and a clean Codex autoreview.

There is one explicit follow-up: a docs freshness alarm. The PR points out that nothing currently alerts maintainers when the docs mirror trails `openclaw/openclaw` `main` by more than about an hour.

## Bottom Line

OpenClaw's docs pipeline should now keep up during bursty merge windows instead of starving itself through repeated cancellations. It is a small workflow change with a clear user-facing payoff: fresher docs without manual rescue runs.
