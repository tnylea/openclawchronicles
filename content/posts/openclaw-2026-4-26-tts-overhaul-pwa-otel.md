---
title: "OpenClaw v2026.4.25: Full TTS Overhaul, PWA Push Notifications, and OTEL Everywhere"
excerpt: "OpenClaw v2026.4.25 lands with a sweeping TTS upgrade, Web Push for the Gateway control UI, expanded OpenTelemetry coverage, and browser automation hardening."
coverImage: '/assets/images/posts/openclaw-2026-4-26-tts-overhaul-pwa-otel.png'
date: '2026-04-26T23:05:00.000Z'
dateFormatted: April 26th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-26-tts-overhaul-pwa-otel.png'
---

OpenClaw's v2026.4.25 release — currently rolling through its beta cycle — is one of the most substantial single-version updates in months. Four betas landed today alone, each refining a release that touches nearly every layer of the platform: voice output, plugin infrastructure, observability, browser automation, and the control UI. Here's what's changed.

## TTS Gets a Complete Rebuild

The standout headline is voice. The TTS layer has been overhauled end-to-end with six new provider integrations and a richer control model:

- **New providers**: Azure Speech (with SSML escaping and native Ogg/Opus output), ElevenLabs v3, Xiaomi, Volcengine, Inworld, and Local CLI are all now bundled options.
- **`/tts latest`** — a new slash command that reads the most recent message aloud on demand, with built-in duplicate suppression so it doesn't double-up on already-spoken content.
- **`/tts chat on|off|default`** — session-scoped auto-TTS toggle, letting users flip voice mode for the current chat without touching global config.
- **Per-agent TTS overrides**: individual agents can now define their own voice and provider via `agents.list[].tts`, overriding the global `messages.tts` setting.
- **Per-account channel overrides**: Feishu and QQBot accounts gain deep-merge support for `channels..accounts..tts`, enabling per-account voice configs over the global baseline.
- **Discord voice model override**: `channels.discord.voice.model` now lets you pick a different LLM for voice channel responses, independent of STT and TTS media settings. ([#64368](https://github.com/openclaw/openclaw/pull/64368))

The WhatsApp read-aloud flow is now complete: `/tts latest` works with duplicate suppression for on-demand voice notes in current-chat replies.

## Plugin Registry Moves Cold

Plugin startup and install paths have been migrated off of runtime manifest scans and onto a **cold persisted registry**. The practical effect:

- Startup is faster — broad manifest scans at boot are replaced by indexed registry reads.
- `openclaw plugins list` now reads from the cold registry snapshot by default.
- `openclaw plugins registry` is a new command for explicit registry inspection and `--refresh` repair.
- `openclaw doctor --fix` now refreshes the plugin index and cold registry without treating install records as authored config.

The `OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY` environment variable is now deprecated and marked as a break-glass switch. Operators should use `registry repair` instead.

Plugin hooks also expanded: `before-agent-finalize` hooks, cron `jobId` hook context, bounded native permission fingerprints, and Codex MCP hook relay support are all new. ([#71765](https://github.com/openclaw/openclaw/pull/71765), [#71758](https://github.com/openclaw/openclaw/pull/71758), [#71707](https://github.com/openclaw/openclaw/pull/71707))

## OpenTelemetry Coverage Expands Significantly

Observability coverage in v2026.4.25 is now considerably broader. New telemetry surfaces include:

- **Model call spans**: GenAI attributes aligned with the OpenTelemetry stability opt-in spec (`gen_ai.provider.name` emitted under `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`).
- **Harness lifecycle**: `openclaw.harness.run` spans and `openclaw.harness.duration_ms` metrics for QA-lab, Codex, and future harnesses — all sharing one trace shape.
- **Token usage, tool loops, exec processes, outbound delivery, context assembly, and memory pressure** all now emit bounded low-cardinality attributes.
- **W3C traceparent propagation**: trusted trace context from model calls is now forwarded to provider transports, with caller-supplied values replaced.
- **Signal-specific OTLP endpoints**: traces, metrics, and logs can now each have their own OTLP endpoint via config or standard OTEL environment variables.
- **Bundled diagnostics-prometheus plugin**: a new plugin adds a protected gateway scrape route for Prometheus-compatible low-cardinality metrics.
- **Provider request hashes**: request identifiers are now surfaced as bounded hashes on span events without exporting raw IDs.

## Control UI Gets PWA and Web Push

The Gateway chat interface can now be installed as a **Progressive Web App** and receive **Web Push notifications**. ([#44590](https://github.com/openclaw/openclaw/pull/44590)) This closes the gap with native app experiences for users who primarily interact with OpenClaw through the browser-based control UI.

The `openclaw browser start --headless` command is also new — a one-shot override for launching the managed browser in headless mode without rewriting persisted config. Raspberry Pi users benefit from configurable CDP readiness timeouts to handle slower hardware. ([#66803](https://github.com/openclaw/openclaw/issues/66803))

## Crestodian Gets a TUI and First-Run Flow

The Crestodian setup experience has been significantly upgraded with:

- A **full TUI interactive mode** for the Crestodian planner
- A **first-run setup helper** with local planner fallback
- **Startup progress indicators** and a shorter startup greeting
- A **context mode selector** for choosing between context modes on startup

([#71720](https://github.com/openclaw/openclaw/pull/71720), [#71760](https://github.com/openclaw/openclaw/pull/71760))

## Install and Update Hardening

Cross-platform install hardening covers Windows, macOS, Linux, Docker, bundled plugin runtime deps, Node service restarts, LaunchAgent token rotation, and mixed-version gateway verification — contributed by six separate community members.

Google Meet also gains calendar-backed attendance export workflows, export manifests, and dry-run previews.

## How to Update

```bash
npm install -g openclaw@latest
```

For those tracking the beta: `v2026.4.25-beta.4` is the latest as of this writing. The full changelog is on [GitHub Releases](https://github.com/openclaw/openclaw/releases).
