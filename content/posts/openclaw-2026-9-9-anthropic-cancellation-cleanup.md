---
title: "OpenClaw Retains Anthropic Calls Through Cancellation"
excerpt: "OpenClaw now keeps Anthropic request runtimes alive through cancellation cleanup, preserving ownership while aborted calls still return promptly."
coverImage: '/assets/images/posts/openclaw-2026-9-9-anthropic-cancellation-cleanup.png'
date: '2026-09-09T23:01:00.000Z'
dateFormatted: September 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-9-anthropic-cancellation-cleanup.png'
---

OpenClaw has tightened how it handles aborted Anthropic requests, keeping prepared runtime resources alive while response-body cancellation is still cleaning up.

The fix landed in [PR #143377](https://github.com/openclaw/openclaw/pull/143377), titled `fix: retain Anthropic requests through cancellation cleanup`. The issue was subtle but important: an aborted Anthropic request could release its prepared runtime before the response body had fully cancelled. In some paths, cancellation could also run in the aborting caller's context instead of the request's original context.

For users, the goal is not to make cancellation slower. It is to keep aborts prompt while making sure the runtime is not retired too early.

## What Changed

The implementation starts response-body cancellation once, in the parser's original continuation, then hands that actual cancellation promise to the existing host work observer before reporting the abort.

Previously, the abort listener started cancellation and discarded the promise. A second cancellation path in the parser could then appear resolved even though the first cleanup was still active. That created a lifetime gap around the prepared runtime.

The PR describes the production repair as small: seven added lines and two removed lines. The behavior changes are more meaningful than the diff size:

- Normal non-abort cleanup remains awaited.
- Aborts preserve the original abort reason.
- Cleanup failures do not replace that original reason.
- The runtime stays retained until accepted cancellation work finishes.

No public API, dependency, or database policy changes are introduced.

## Why This Matters

OpenClaw's provider integrations increasingly depend on prepared runtimes, request ownership, and managed resource lifetimes. If a request is aborted, there may still be body cleanup, parser cleanup, or host-observed work that needs the original runtime context.

Releasing that runtime too early can create hard-to-debug edge cases. A new ModelRegistry might be built while cleanup is still running. Work can be attributed to the wrong continuation. Follow-up preparation can overlap with cleanup that should still be attached to the original owner.

This fix keeps the user-facing cancellation behavior crisp while preserving the internal ownership model. That is a good trade for agents that may interrupt, retry, or switch contexts during long provider calls.

## Validation

The PR reports that the original code failed three transport regressions and a core ownership case. The candidate passed 148 transport and core cases, affected checks, an isolated Codex review through P2, and an ordinary build.

The proof used a managed Anthropic transport against a local synthetic HTTP server. It confirmed that abort reporting remained fast, the original owner stayed alive, overlapping preparation reused its generation, and final drainage waited for held cancellation to settle.

After rebasing onto current main, the author reports that all 157 transport and core composition cases passed again. No real vendor credentials or production Gateway were used for the proof.

In practical terms, this is a provider-runtime correctness fix: aborted Anthropic calls still end quickly for the user, but OpenClaw now holds onto the right resources until cleanup has actually finished.
