---
title: "OpenClaw v2026.4.25: TTS Overhaul, PWA Gateway, and OpenTelemetry"
excerpt: "OpenClaw v2026.4.25 is out with a complete TTS upgrade, six new voice providers, PWA Web Push for Gateway chat, and expanded OpenTelemetry coverage."
coverImage: '/assets/images/posts/openclaw-2026-4-27-v2026-4-25-stable-release.webp'
date: '2026-04-27T23:00:00.000Z'
dateFormatted: April 27th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-27-v2026-4-25-stable-release.webp'
---

OpenClaw's April 27 stable release — **v2026.4.25** — landed today and it's one of the largest single-version drops in recent memory. Five major areas get meaningful upgrades: voice/TTS, the web UI, observability, browser automation, and plugin infrastructure. Here's what changed.

## Voice Gets a Complete Overhaul

The headline feature is the TTS system rewrite. Six new providers land in this release: **Azure Speech**, **Xiaomi**, **Local CLI**, **Inworld**, **Volcengine**, and **ElevenLabs v3**. Each ships with full credential wiring, voice listing, and native output format support — Azure Speech, for example, generates Ogg/Opus voice notes and supports SSML escaping out of the box.

Beyond new providers, the TTS surface itself becomes far more configurable:

- `/tts latest` enables read-aloud in WhatsApp with duplicate suppression
- `/tts chat on|off|default` toggles session-scoped auto-TTS per conversation
- `agents.list[].tts` lets individual agents override the global voice without touching shared credentials
- Per-channel overrides now deep-merge correctly for Feishu and QQBot accounts

Discord voice channels also gain `channels.discord.voice.model` — you can now route voice channel responses through a different LLM than the text default. ([PR #64368](https://github.com/openclaw/openclaw/pull/64368))

## PWA and Web Push for Gateway Chat

The OpenClaw Control UI adds full **Progressive Web App** support in this release ([PR #44590](https://github.com/openclaw/openclaw/pull/44590)). You can now install Gateway chat as a standalone app from any Chromium-based browser, with Web Push notifications so you don't miss agent replies when the tab is in the background.

The same UI update also ships Crestodian's new **first-run TUI setup flow** — a full interactive terminal wizard that replaces the previous manual config dance. A context mode selector and shorter startup greeting round out the onboarding experience.

## OpenTelemetry Expands Across the Stack

OpenTelemetry coverage in v2026.4.25 is no longer just model calls — it now spans the entire request lifecycle:

- **Model calls** — GenAI span attributes aligned with the OpenTelemetry stability opt-in semantics (`gen_ai.provider.name` under `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`)
- **Token usage and tool loops** — bounded low-cardinality attributes throughout
- **Harness runs** — `openclaw.harness.run` spans and `openclaw.harness.duration_ms` metrics for Codex, QA-lab, and future harnesses
- **Exec processes and outbound delivery** — end-to-end trace coverage
- **Prometheus plugin** — a new bundled `diagnostics-prometheus` plugin adds a protected gateway scrape route for Prometheus-compatible metrics

Signal-specific OTLP endpoint overrides are now supported via config or standard `OTEL_*` environment variables, and W3C `traceparent` headers propagate from trusted model-call trace context to provider transports.

## Browser Automation Improvements

Browser support picks up several quality-of-life fixes aimed at reliability on lower-powered hosts:

- CDP readiness timeouts are now configurable — critical for Raspberry Pi users where Chrome launch is slow ([issue #66803](https://github.com/openclaw/openclaw/issues/66803))
- `openclaw browser start --headless` added as a one-shot headless launch that doesn't rewrite your persisted browser config
- Iframe-aware role snapshots with CDP-native fallback improve accuracy on complex pages
- `openclaw browser doctor --deep` now probes live snapshot state for slower hosts

## Plugin Cold Registry

Plugin startup and install paths move to a **cold persisted registry** in v2026.4.25. Broad manifest scans at startup are replaced by a versioned registry index, making plugin update, repair, provider discovery, and install metadata more deterministic and faster.

`openclaw plugins registry` is a new CLI command for inspecting and repairing the registry directly. `openclaw plugins list` now reads from the cold snapshot by default. The legacy `OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY` environment variable is deprecated and flagged as a break-glass switch — the recommended path is `openclaw doctor --fix`.

## Also in This Release

- **Google Meet** gets calendar-backed attendance export workflows, export manifests, and dry-run previews
- **CLI image generation** exposes `--background` as a generic flag (not just OpenAI), and fal image generation gains `--output-format png|jpeg`
- Plugin hooks add `before-agent-finalize`, cron `jobId` context, and Codex MCP hook relay support ([PR #71765](https://github.com/openclaw/openclaw/pull/71765))
- Bundled tokenjuice runtime bumps to 0.6.3

## Update Now

```bash
npm update -g openclaw
```

Full changelog and upgrade notes: [github.com/openclaw/openclaw/releases/tag/v2026.4.25](https://github.com/openclaw/openclaw/releases/tag/v2026.4.25)
