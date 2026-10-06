---
title: "OpenClaw Fixes New Session Catalog Hangs"
excerpt: "OpenClaw now bounds New Session model catalog waits so stalled publication returns retryable UNAVAILABLE instead of misleading failures."
coverImage: '/assets/images/posts/openclaw-2026-10-6-new-session-catalog-timeout.png'
date: '2026-10-06T08:05:00.000Z'
dateFormatted: October 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-6-new-session-catalog-timeout.png'
---

OpenClaw merged a high-priority Gateway fix this morning for a frustrating startup edge case: creating a New Session could wait for minutes while the model catalog was still publishing, then fail with a misleading authorization-style error after the browser reconnected.

The fix landed in [PR #165989](https://github.com/openclaw/openclaw/pull/165989), titled "fix: New Session hangs while the model catalog is loading." It is labeled P0, which makes it one of the clearest Tier 1 stories from the morning window.

## What Changed

The New Session path now uses a shared 20-second deadline for catalog reads during session creation. If the catalog is still loading after that window, OpenClaw returns a retryable `UNAVAILABLE` response instead of continuing to wait indefinitely.

The user-facing message is explicit: the model catalog is still loading, the session was not created, and the user should retry shortly. That matters because the previous behavior could leave people unsure whether a session had partially started, whether their account was unauthorized, or whether the browser simply lost track of the create request.

The PR says no new session row is committed when the timeout fires. That preserves idempotency: callers can retry the same create after the failed attempt instead of cleaning up an ambiguous partially created session.

## Why It Matters

Model catalogs sit on a sensitive path. They are needed when a create request depends on model or runtime validation, but a slow catalog should not block the entire session workflow until another timeout catches it.

The new behavior separates three things that were previously easy to blur:

- The catalog publication can continue under its own owner.
- The create request can unwind before persistence.
- The caller receives a retryable availability error instead of an authorization-looking failure.

That is a better contract for both the Control UI and API callers. A user who clicks New Session during a cold or busy catalog refresh should get a bounded answer, not a mystery stall.

## The Technical Shape

The implementation gives the create handler ownership of the request-specific budget because it already has access to the request, connection, and captured operator-authority signals.

The deadline is based on monotonic time and is derived from the Gateway request timeout, leaving headroom under the default Node Gateway client timeout. The patch also stops waiting if the requesting connection closes or if the captured authority is revoked while the request is pending.

One small but meaningful cleanup is included: session creation skips thinking-catalog hydration when that metadata is not used by the create path. Plain creates that do not depend on catalog fields remain independent of catalog publication.

## Evidence From the PR

The PR includes a focused Gateway handler test suite with held catalog promises and fake timers. The test table covers catalog non-publication, connection close, authority revocation, shared monotonic budget behavior, plain create behavior, and the unused thinking-hydration case.

The negative control is useful: with the final tests unchanged but the production files restored to the previous mainline behavior, six cases failed. With the candidate restored, all eight cases passed.

The change also ran related account-authority, resolved-model, and fork sibling suites, plus core type graphs and targeted formatting and lint checks. The author notes follow-up work remains for sibling waits such as `sessions.patch`, `sessions.patchMany`, catalog import, and catalog continuation.

## Bottom Line

This is not a flashy feature, but it is the kind of reliability work that makes OpenClaw feel less brittle. New Session is a front-door workflow. Bounding the catalog wait keeps that door responsive when the system is still warming up, and it gives callers a retryable answer they can actually act on.
