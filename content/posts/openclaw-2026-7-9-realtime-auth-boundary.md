---
title: "OpenClaw Fixes Realtime Auth Boundaries"
excerpt: "OpenClaw now requires Platform API keys for Realtime voice and transcription, avoiding failed Codex OAuth fallbacks."
coverImage: '/assets/images/posts/openclaw-2026-7-9-realtime-auth-boundary.png'
date: '2026-07-09T08:00:00.000Z'
dateFormatted: July 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-9-realtime-auth-boundary.png'
---

OpenClaw merged [PR #102518, "fix(openai): correct Realtime auth and transcription secrets"](https://github.com/openclaw/openclaw/pull/102518), a focused OpenAI provider fix for Talk, Voice Call, and streaming transcription flows.

The issue was an auth-boundary mismatch. OpenAI Realtime voice and streaming transcription were treating Codex OAuth credentials as if they could be used interchangeably with OpenAI Platform API keys. Those tokens were then sent toward public Platform endpoints where they were not valid for the job. The transcription path also used the retired `/v1/realtime/transcription_sessions` endpoint, so even valid credentials could hit a 404.

## What Changed

The new behavior is stricter: OpenClaw now requires Platform API-key sources for both OpenAI Realtime surfaces. It stops discovering or advertising Codex OAuth as Realtime auth and instead makes the Platform API-key requirement explicit.

The transcription secret path also moves to the current `/v1/realtime/client_secrets` API shape. That matters because browser-side Realtime and transcription sessions need short-lived client secrets, not a stale endpoint that no longer issues them.

PR #102518 also changes credential precedence. A configured API-key profile is preferred over `OPENAI_API_KEY`, matching the Talk path and preventing an old environment variable from shadowing the profile the operator actually selected.

## Why It Matters

This is not just a documentation cleanup. OpenClaw has several ways to authenticate with OpenAI-related systems, and they do not all belong to the same trust boundary.

Codex account auth is routed through the ChatGPT/Codex backend. Platform Realtime conversations use the public OpenAI Platform endpoint. Blending those two flows creates confusing failures and can send the wrong kind of credential to the wrong service.

The PR frames the fix as an auth-owner boundary change rather than a SecretRef transport workaround. That is the right distinction: SecretRefs help with how credentials are stored and resolved, but they cannot make a Codex OAuth token valid for a Platform API that expects a Platform key.

## User Impact

Control UI Talk and Voice Call Realtime should no longer try a doomed OAuth fallback. Users get an actionable Platform API-key requirement instead of a confusing provider failure.

Streaming transcription is also repaired against the current client-secret API. Existing SecretRef-backed Platform keys still resolve only at the network boundary, so operators who already configured Platform credentials through OpenClaw's secret flow should not need to move secrets into plaintext config.

The PR also bounds 401 errors so provider responses cannot echo credential material back into the UI, which fits the broader July hardening theme around provider responses and secret surfaces.

## Validation

The PR reports 80 passing tests across three focused OpenAI Realtime suites, plus `pnpm check:changed`. It also includes live OpenAI API proof with a 1Password-backed Platform key:

- The old transcription endpoint returned HTTP 404.
- The current transcription client-secret request returned HTTP 200.
- The current Realtime browser client-secret request returned HTTP 200.

On a live OpenClaw Gateway with a file SecretRef, `talk.client.create` returned the OpenAI WebRTC transport and the current Realtime calls offer URL without exposing the Platform key.

## Bottom Line

OpenClaw's OpenAI integration is separating account auth from Platform auth more clearly. For users, that means fewer mysterious Realtime failures. For operators, it means Realtime voice and transcription now line up with the credential type those public OpenAI APIs actually require.
