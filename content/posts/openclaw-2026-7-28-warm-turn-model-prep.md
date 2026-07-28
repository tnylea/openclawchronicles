---
title: "OpenClaw Speeds Up Warm Agent Turn Startup"
excerpt: "OpenClaw now reuses prepared model runtime snapshots, cutting repeated model-resolution work before warm agent turns begin."
coverImage: '/assets/images/posts/openclaw-2026-7-28-warm-turn-model-prep.png'
date: '2026-07-28T23:01:00.000Z'
dateFormatted: July 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-28-warm-turn-model-prep.png'
---

OpenClaw merged a performance change late Tuesday aimed at making warm agent turns start faster. [PR #113817](https://github.com/openclaw/openclaw/pull/113817), `improve(agents): speed up warm turn model preparation`, landed at 22:45 UTC and focuses on repeated model-resolution work inside the Gateway.

The problem was not the model call itself. The PR says warm agent turns repeatedly rebuilt configured provider models and reran static model-catalog resolution during model setup and authentication preparation. On gateways with several configured models, that synchronous work could block the Gateway event loop before the model call even began.

## The Bottleneck

According to the PR, the original report measured roughly four model resolutions per turn. On one live gateway with two configured providers and 39 models, `findInlineModelMatch` alone took about 1.49 seconds per resolution, and the non-default agent's `model-resolution` stage reached 6.23 seconds.

That is an expensive preflight cost for something users experience as simple latency: they send a message, and the agent takes too long to begin responding. It also matters operationally because synchronous work on the Gateway event loop can affect more than the single request that triggered it.

## The Fix

The Gateway already owns a prepared model-runtime snapshot that is replaced when configuration reloads. [PR #113817](https://github.com/openclaw/openclaw/pull/113817) moves more of the model preparation into that lifecycle boundary.

The change prepares both the inline-provider projection and configured static models when the runtime snapshot is published. Later request-time resolution can then reuse that snapshot during initial setup, auth-plan materialization, and snapshot-backed lookup.

The PR also notes that fallback behavior remains intact. Callers without a prepared snapshot still use the pure request-time path, including the correct behavior for provider objects mutated in place. Dynamic provider hooks and manifest or runtime-discovery precedence still run before static fallback.

## Measured Impact

The live before-and-after numbers are sharp:

- `findInlineModelMatch`: 1490 ms before, 0 ms after
- `resolveModelAsync`: 1922 ms per call before, 385 ms after
- Default-agent turn: 7547 ms before, 1880 ms after
- Non-default-agent turn: 12990 ms before, 2456 ms after
- Non-default `model-resolution` stage: 6234 ms before, 164 ms after

The PR is careful about scope: this addresses the measured model-preparation contributor to issue #75782, but does not claim to remove every remaining authentication-initialization cost.

## Why Operators Should Care

OpenClaw installations with multiple providers and many configured models are exactly the ones likely to feel this improvement. The more OpenClaw becomes a personal or team control plane, the more users expect warm turns to feel immediate rather than weighed down by catalog work.

The evidence includes Node 26 V8 CPU profiling on a Blacksmith Testbox, focused model-resolution and inference-runtime tests, embedded-agent E2E tests, source-blind CLI validation against a working Gateway, and a clean independent Codex autoreview.

This is not a flashy feature, but it is the kind of runtime polish that makes everyday agent work feel more responsive.
