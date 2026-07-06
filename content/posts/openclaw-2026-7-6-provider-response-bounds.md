---
title: "OpenClaw Bounds OAuth and Webhook Responses"
excerpt: "OpenClaw now caps successful OpenRouter OAuth and Discord webhook JSON responses to avoid unbounded provider reads."
coverImage: '/assets/images/posts/openclaw-2026-7-6-provider-response-bounds.png'
date: '2026-07-06T08:04:00.000Z'
dateFormatted: July 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-6-provider-response-bounds.png'
---

OpenClaw merged [PR #98098, "fix(providers): bound successful OAuth and webhook responses"](https://github.com/openclaw/openclaw/pull/98098), closing two remaining unbounded JSON response paths in provider-controlled flows.

The merged change covers successful Discord webhook execution responses and OpenRouter OAuth code exchange responses. Both now use OpenClaw's shared provider JSON response reader so oversized streams can be rejected and canceled instead of buffered without a bound.

This is a P2 fix, but it carries auth-provider and message-delivery risk labels. That combination is worth watching because the affected paths sit directly on provider and channel boundaries.

## What Changed

The PR moves the remaining successful JSON reads to `readProviderJsonResponse`, the shared helper used to apply a response cap. The author notes that the original Google path was removed from scope because `fetchWithTimeout` already applies the same 16 MiB response cap, and the proposed Nextcloud path had already been fixed on `main`.

The Discord side keeps its existing transport contract. Discord webhook sends using `wait=false` can return `204` with no body, and optional response bodies after successful non-idempotent posts can be absent, malformed, or oversized without turning the already-completed send into an error that might trigger a duplicate bot fallback.

The OpenRouter OAuth side now rejects and cancels oversized successful responses during code exchange. That prevents a hostile or broken endpoint from forcing OpenClaw to buffer an unbounded body on a credential-adjacent path.

## Why It Matters

OpenClaw has been steadily tightening provider and channel response handling. Error responses are not the only risk. A successful response can still be oversized, malformed, or controlled by infrastructure outside the user's machine.

That matters for OAuth because credential flows should have predictable memory and parsing behavior. It also matters for Discord because message delivery paths must avoid both silent resource hazards and accidental duplicate sends.

The subtle part of this PR is that it hardens reads without changing the success semantics for Discord. OpenClaw can cancel an oversized optional body while still treating the non-idempotent webhook send as complete, avoiding a fallback message that could make users see two bot replies.

## Validation

The PR reports a focused Blacksmith Testbox run covering formatting plus 12 Discord webhook tests and 9 OpenRouter OAuth tests. A changed gate also passed extension typechecks, test typechecks, lint, dependency guards, database-first guard, sidecar checks, and import-cycle checks.

The oversized-stream tests verify rejection and cancellation for OpenRouter, plus cancellation without duplicate-send failure for Discord. The author also ran unauthenticated live probes against current Discord, OpenRouter, and Google JSON error endpoints without using credentials or external writes.

## Bottom Line

OpenClaw now applies bounded successful JSON reads to OpenRouter OAuth exchange and Discord webhook response paths. It is a narrow hardening change, but it protects exactly the kind of provider-controlled boundary that should never rely on unlimited buffering.
