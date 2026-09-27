---
title: "OpenClaw Retires Sora Video After API Shutdown"
excerpt: "OpenClaw removed its Sora video provider after OpenAI shut down the API, so agents now skip dead endpoints and use configured alternatives."
coverImage: '/assets/images/posts/openclaw-retires-sora-video-provider.png'
date: '2026-09-27T23:01:00.000Z'
dateFormatted: September 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-retires-sora-video-provider.png'
---

OpenClaw has removed its OpenAI Sora video-generation provider after the upstream API stopped working for video calls.

The change landed in [PR #159543](https://github.com/openclaw/openclaw/pull/159543), titled `fix(openai): video generation fails with HTTP 404 after OpenAI retired Sora`. The PR says `video_generate` failed whenever it routed to `openai/sora-2` or `openai/sora-2-pro`.

## What Changed

OpenClaw no longer registers Sora as a usable video backend. That means agents should stop selecting a provider that cannot complete a video request.

When a video model is still configured as `openai/sora-*`, the runtime now skips the stale provider reference and moves on to configured fallbacks or auto-detected providers. If no usable provider exists, users should get a plain explanation instead of a failing OpenAI HTTP 404 path.

The PR specifically says OpenAI-only installs no longer receive a `video_generate` tool until another video provider is configured.

OpenAI image, speech, transcription, and realtime support are unchanged. The old OpenAI image-and-video documentation URL remains available, but now describes the page as image-only with a retirement note.

## Operator Action

Operators should check `agents.defaults.mediaModels.video`. If it names `openai/sora-*`, switch it to another configured provider.

The PR lists working alternatives verified during live tests:

- Runway
- Google Veo
- MiniMax
- xAI
- fal
- other configured video providers

No migration runs automatically. That is intentional: OpenClaw cannot infer which paid video backend an operator wants to use next.

## Why It Matters

This is a compatibility fix, but it also tightens the agent experience. A dead provider that still appears valid is worse than a missing provider because agents can repeatedly choose an endpoint that has no chance of succeeding.

The pull request says live OpenAI probes on September 27, 2026 found `/v1/videos` returning 404, while the model objects for `sora-2` and `sora-2-pro` carried a `shutdown_date` of September 24, 2026.

Rather than keep a shim around a retired API, OpenClaw removed the provider contract, metadata, live-test defaults, workflow filters, and docs that advertised Sora video generation.

## The Bigger Pattern

Media tools are now part of normal agent workflows, not just demos. When a provider retires an API, the registry layer needs to fail closed enough that agents do not keep wasting turns on impossible calls.

This update keeps OpenClaw's video-generation surface honest: show the tool only when a real backend is configured, use working providers when available, and tell the operator when none exists.
