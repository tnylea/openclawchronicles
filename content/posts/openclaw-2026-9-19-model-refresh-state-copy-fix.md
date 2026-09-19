---
title: "OpenClaw Stops Model Refresh Database Copies"
excerpt: "OpenClaw cuts repeated state-database copies during model catalog and authentication refreshes after provider loading."
coverImage: '/assets/images/posts/openclaw-2026-9-19-model-refresh-state-copy-fix.png'
date: '2026-09-19T23:04:00.000Z'
dateFormatted: September 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-19-model-refresh-state-copy-fix.png'
---

OpenClaw merged [PR #153130](https://github.com/openclaw/openclaw/pull/153130), a Gateway performance fix that stops repeated model-catalog and authentication refreshes from copying the whole shared state database.

The problem showed up after provider loading, especially with providers such as OpenRouter. Each request could stage another database copy, producing sustained SSD writes and extra CPU load for what should be routine refresh work.

## The Refresh Path

The PR explains the root cause through the provider import path. OpenRouter's SDK import graph registered the Claw consent configuration preparer in the catalog worker. Because the shared catalog worker reconstructs configuration for each task, that preparer repeatedly invoked the preservation snapshot reader from an isolate without the host's state connection.

In plainer terms: refresh work that should have reused already-prepared host facts kept falling back to heavier snapshot behavior. Once that loop is hit on a large state database, background refreshes can become noisy disk work.

## The Fix

The new path captures prepared Claw consent provenance at dispatch and transfers it into the worker request. The worker consumes those facts inside a request-bound scope, including late provider imports.

The scope is deliberately tight:

- Facts are bound to the selected state path.
- They cannot be reused after the request completes.
- They cannot be consumed against another state path.
- Ready, error, and uninitialized states remain distinct.
- The request fingerprint includes the transferred facts.

That keeps the optimization from becoming a hidden global cache. Per-task agent and credential reconstruction remain in place, and existing consent checks, cross-process refresh, and Doctor's artifact-preserving inspection are preserved.

## Reported Impact

The PR includes published-versus-candidate Linux proof using a synthetic OpenRouter catalog and an approximately 176.8 MB shared database.

Across six catalog refreshes in 30 seconds, the published package made six preservation copies while the candidate made zero. Across 24 authentication refreshes in 120 seconds, the published package made 24 copies while the candidate again made zero.

The write-byte deltas were also stark: about 1.24 GB versus 36 KB for the catalog-refresh sample, and about 4.6 GB versus 178 MB for the authentication-refresh sample. The PR frames these as test measurements, not universal performance guarantees, but the direction is very clear.

## Why It Matters

OpenClaw is increasingly a long-running local service. Background refreshes should be boring. They should not quietly turn provider catalog checks into gigabytes of disk churn.

This fix is especially relevant for users with larger state databases, active provider catalogs, or frequent authentication refreshes. It reduces the cost of staying current without changing configuration, schema, stored data, or update and rollback behavior.

It also pairs neatly with the new TypeSafe decision-model work. As OpenClaw grows more provider roles and model catalogs, keeping those refresh paths lightweight becomes part of the product experience rather than mere housekeeping.

