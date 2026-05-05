---
title: "OpenClaw v2026.4.22: xAI Providers, TUI Mode, and Tencent Cloud"
excerpt: "OpenClaw v2026.4.22 lands xAI image generation, TTS and STT, a standalone TUI embedded mode, Tencent Cloud, and Tokenjuice in one enormous drop."
coverImage: '/assets/images/posts/openclaw-2026-4-23-v2026422-xai-tui-tencent.png'
date: '2026-04-23T23:00:00.000Z'
dateFormatted: April 23rd 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-23-v2026422-xai-tui-tencent.png'
---

OpenClaw [v2026.4.22](https://github.com/openclaw/openclaw/releases/tag/v2026.4.22) dropped on April 22nd and it is one of the biggest releases in recent memory. The changelog spans five new provider integrations, a fully standalone terminal mode, a diagnostics export tool, and a batch of performance wins that make the gateway meaningfully faster to start.

## xAI Gets Full Multimedia Coverage

The headline item is a comprehensive xAI provider overhaul contributed by [@KateWilkins](https://github.com/KateWilkins). OpenClaw now supports:

- **Image generation** via `grok-imagine-image` and `grok-imagine-image-pro`, including reference-image edits
- **Text-to-speech** with six live xAI voices and output formats: MP3, WAV, PCM, and G.711
- **Speech-to-text** via `grok-stt` for audio transcription
- **Realtime transcription** for Voice Call streaming

On the STT front, Voice Call streaming transcription also expanded to cover **Deepgram, ElevenLabs, and Mistral** — joining the existing OpenAI and xAI realtime paths. ElevenLabs additionally gains Scribe v2 batch transcription for inbound media.

## TUI Embedded Mode — No Gateway Required

[@fuller-stack-dev](https://github.com/fuller-stack-dev) contributed a long-requested feature: a local embedded mode for the terminal UI that lets you run full chat sessions without a running Gateway. Plugin approval gates remain enforced, so you don't lose any of the safety controls you'd normally get through the Gateway. This is a big deal for developers who want a lightweight local setup or want to test config changes without touching a running production Gateway.

## New Providers: Tencent Cloud and Amazon Bedrock Mantle

Two new cloud providers land in this release:

**Tencent Cloud** — a bundled provider plugin with TokenHub onboarding, docs, `hy3-preview` model catalog entries, and tiered Hy3 pricing metadata. Contributed by [@JuniperSling](https://github.com/JuniperSling).

**Amazon Bedrock Mantle** — adds Claude Opus 4.7 via Mantle's Anthropic Messages route, with provider-owned bearer-auth streaming. This means the model is actually callable without treating AWS bearer tokens as Anthropic API keys — a subtle but important distinction for enterprise setups. Contributed by [@wirjo](https://github.com/wirjo).

## Tokenjuice: Compact Your Noisy Tool Results

[@vincentkoc](https://github.com/vincentkoc) contributed **Tokenjuice** as an opt-in bundled plugin. It compacts noisy `exec` and `bash` tool results during Pi embedded runs, which is particularly useful when you're running long agentic sessions that accumulate verbose output. Enable it under `plugins.entries.tokenjuice`.

## /models add — Register Models Without Restarting

[@Takhoffman](https://github.com/Takhoffman) contributed a `/models add` command that lets you register a new model directly from chat and use it immediately without restarting the Gateway. The existing `/models` command becomes a clean provider browser, with clearer guidance and copy-friendly examples.

## GPT-5 Overlay Now Shared Across Providers

The GPT-5 prompt overlay moves out of the OpenAI plugin and into the shared provider runtime. Compatible GPT-5 models now receive the same behavior and heartbeat guidance whether routed through OpenAI, OpenRouter, OpenCode, Codex, or other GPT providers. The `agents.defaults.promptOverlays.gpt5.personality` toggle controls the friendly-style behavior globally.

## WhatsApp Gets Per-Group System Prompts and Native Reply Quoting

Two quality-of-life improvements for WhatsApp users:

- **Configurable native reply quoting** via `replyToMode`, contributed by [@mcaxtr](https://github.com/mcaxtr)
- **Per-group `systemPrompt` forwarding** into `GroupSystemPrompt` context, so configured behavioral instructions apply on every turn. Supports `"*"` wildcard fallback. Closes [#7011](https://github.com/openclaw/openclaw/issues/7011), contributed by [@Bluetegu](https://github.com/Bluetegu)

## Performance Wins

This release is packed with startup and runtime performance improvements:

- **82–90% faster plugin loading** with native Jiti loading for bundled plugin dist modules ([#69925](https://github.com/openclaw/openclaw/pull/69925))
- **74% faster `openclaw doctor`** non-interactive runtime with lazy-loaded plugin paths ([#69840](https://github.com/openclaw/openclaw/pull/69840))

## Diagnostics Export

[@gumadeiras](https://github.com/gumadeiras) added a support-ready diagnostics export command that bundles sanitized logs, status, health, config, and stability snapshots. Stability recording is now also enabled by default. When you need to file a bug report, the tooling is now actually there to help you do it properly ([#70324](https://github.com/openclaw/openclaw/pull/70324)).

## Notable Fixes

- **Models/auth merge fix** — re-authenticating an OAuth provider (like OpenAI Codex) no longer wipes other providers' aliases and per-model params. Fixes [#69414](https://github.com/openclaw/openclaw/issues/69414)
- **Azure OpenAI image generation** — proper Azure auth, deployment-scoped URLs, and `AZURE_OPENAI_API_VERSION` support
- **OpenAI Codex CLI auth** — removed the import path that copied `~/.codex` OAuth material into agent auth stores; use browser login or device pairing instead
- **Local backend token accounting** — streaming usage now correctly recovered from llama.cpp-style timing metadata, fixing unknown/stale context totals
- **`/status` Runner field** — sessions now report whether they run on embedded Pi, a CLI-backed provider, or an ACP harness agent

The full changelog is available on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.4.22). This is a recommended upgrade.
