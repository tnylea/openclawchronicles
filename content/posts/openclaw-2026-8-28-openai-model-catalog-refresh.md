---
title: "OpenClaw Keeps OpenAI Models Available After Refresh"
excerpt: "OpenClaw now preserves proven working OpenAI model routes after catalog refreshes, keeping SecretRef-backed Codex chats usable."
coverImage: '/assets/images/posts/openclaw-2026-8-28-openai-model-catalog-refresh.png'
date: '2026-08-28T23:01:00.000Z'
dateFormatted: August 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-28-openai-model-catalog-refresh.png'
---

OpenClaw merged a targeted authentication fix just before the August 28th nightly cutoff that should reduce a frustrating model-picker failure mode. [PR #131803](https://github.com/openclaw/openclaw/pull/131803), merged at 22:59 UTC, keeps working OpenAI models available after a catalog refresh when the route has already succeeded through a SecretRef-backed API-key profile.

The bug was subtle. A user could complete a real Codex runtime turn successfully, then refresh the model catalog and see the working model change to `Sign-in needed`. The model still had proof of a successful route, but the separate discovery result could report `auth-rejected` and override the user-facing availability state.

## Proven Runtime Success Now Carries Weight

The fix gives OpenClaw a more careful way to separate two facts that can both be true: a previous runtime route succeeded, and a later catalog request produced an authentication diagnostic. The catalog diagnostic still appears, but it no longer erases a proven working route when the evidence belongs to the same SecretRef-backed profile.

The PR describes three owner boundaries. The successful-run producer accepts a hydrated API-key profile only when it still has a SecretRef and the resolved credential provenance names that exact profile. Post-success validation uses a dedicated execution-only fact rather than treating authored request metadata as proof. Availability resolution then replays provider policy for the executed route and marks it as an exact runtime success when the owner remains compatible.

That sounds internal, but the result is directly visible: opening the model picker should not disable a healthy Control UI chat after a successful OpenAI or Codex turn.

## Fail-Closed Cases Remain Unavailable

The patch does not turn any model into available merely because a user selected it once. Literal credentials, mismatched provenance, omitted profiles, incompatible runtimes, and revoked success facts still remain unavailable. Real missing or rejected credentials continue to produce the existing authentication guidance and send gate.

That balance is important for OpenClaw's provider model. A catalog refresh should not be able to strand a valid session, but it also should not turn stale or mismatched credential evidence into broad access.

## Why This Matters For Control UI

Model pickers are trust surfaces as much as convenience surfaces. If a picker labels a working model as unavailable, users are pushed toward unnecessary reauthentication, provider switching, or debugging a route that already works. If it over-trusts a stale success, it can hide a real credential failure.

This fix narrows that distinction:

- Successful SecretRef-backed runtime routes can preserve availability.
- Catalog refreshes can still report discovery diagnostics.
- Missing, rejected, literal, or mismatched credentials stay gated.
- The composer remains enabled only when the exact runtime route is proven usable.

The evidence includes a live before/after proof, focused route-policy and catalog-outcome tests, `check-changed`, independent review, and a stable UI verification showing the model enabled with no `Sign-in needed` text after opening the picker.

For OpenClaw teams using OpenAI API-key profiles through SecretRef, this is a small patch with a noticeable operational effect. It keeps the model catalog honest without letting a noisy refresh undo what the runtime has already proven.
