---
title: "OpenClaw v2026.5.9 Beta: Discord Gets Real-Time Voice Modes"
excerpt: "OpenClaw v2026.5.9-beta.1 ships multi-mode Discord realtime voice, Amazon Bedrock service tiers, and a full Gemini 3.1 migration in one big beta drop."
coverImage: '/assets/images/posts/openclaw-2026-5-9-discord-voice-realtime.webp'
date: '2026-05-09T23:00:00.000Z'
dateFormatted: May 9th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-9-discord-voice-realtime.webp'
---

OpenClaw dropped a hefty pre-release late Friday: **v2026.5.9-beta.1**, tagged at 13:32 UTC on May 9th. It lands hours after the v2026.5.7 stable release and packs enough changes to warrant a full deep-dive on its own. If you run a Discord-connected OpenClaw instance — or you're a heavy Bedrock or Gemini user — you'll want to read this one before the stable tag arrives.

## Discord Voice Goes Multi-Modal

The headline feature is a ground-up rework of Discord voice channel support. OpenClaw now ships three distinct realtime voice modes:

- **agent-proxy** (new default) — Voice acts as the microphone and speaker extension of your routed OpenClaw agent session. The agent brain stays fully in the loop; voice is just the I/O layer.
- **stt-tts** — Classic speech-to-text in, text-to-speech out. Still available as an explicit fallback when latency is more important than agent depth.
- **bidi realtime** — Full bidirectional realtime session via `openclaw_agent_consult`. This mode routes through the OpenAI realtime bridge, keeps consults quiet while the supervisor agent is thinking, and accepts Codex-style conversation events end-to-end.

Alongside the mode split, the team improved voice capture quality significantly. The default post-speech silence grace period was extended to 2.5 seconds (configurable via `voice.captureSilenceGraceMs`), which should eliminate most choppy captures in active Discord servers. The `/vc` command also gained new diagnostics — you can now run `openclaw channels status --probe` to catch missing Connect, Speak, or Read Message History permissions before joining a channel.

Barge-in behavior got smarter too. A new `voice.realtime.minBargeInAudioEndMs` option lets high-echo rooms opt out of immediate barge-in cuts while lower-echo setups keep the snappy 0ms default.

## Amazon Bedrock Service Tiers

Enterprise OpenClaw operators get a long-requested feature: `serviceTier` support for Bedrock models. Valid values are `default`, `flex`, `priority`, and `reserved`, and they can be set globally via `agents.defaults.params.serviceTier` or per-model in `agents.defaults.models`. This maps directly to Bedrock's cross-region inference profiles and lets teams carve out dedicated throughput for production agents. Thanks to [@mobilinkd](https://github.com/mobilinkd) for the PR.

## Gemini 3.1 Migration

OpenClaw is retiring `google/gemini-3-pro-preview` in favor of the canonical `google/gemini-3.1-pro-preview` ID. The update touches five separate normalization paths — provider catalog resolution, proxy-provider IDs, dynamic model resolution, onboarding alias maps, and `doctor --fix` recovery — so the migration should be transparent for most users.

If you're on a Kilo-style configured catalog or a custom provider entry using the old Gemini 3 Pro ID, run `openclaw config validate` after updating. The recovery docs for Codex OAuth routing (updated alongside) are at [docs.openclaw.ai/providers/openai](https://docs.openclaw.ai/providers/openai#check-and-recover-codex-oauth-routing).

## The oc-path Plugin

A new optional bundled plugin — `oc-path` — shows up in this beta. It adds the `openclaw path` command for surgical `oc://` access to Markdown, JSONC, and JSONL workspace files. Think of it as a lightweight file-addressing layer that lets agents reference specific workspace documents without needing full exec access. It ships off by default and requires an explicit install.

## Unified Model Catalog

The plugin SDK now includes a unified model catalog registration surface covering text, image, video, and music providers in a single `providerCatalogEntry` manifest format. This underpins the live catalog caching and per-model video capability overlays that have been landing across the last several releases. For plugin authors, the new `presentation helpers` for controls-only interactive rendering mean you can build richer channel UIs without duplicating native card logic.

## /think default and /fast default

A small quality-of-life addition from [@VACInc](https://github.com/VACInc): `/think default` and `/fast default` commands now clear session-level reasoning overrides and fall back to your configured or provider default. Previously you had to restart the session to drop a manual `/think` override.

## Control UI: Session History Rollups

The Control UI picks up transcript-backed historical lineage rollups for sessions that have rotated. You can now toggle between current-instance usage and full historical-lineage scope, with long-range presets — fixing the long-standing issue (#50701) where usage history disappeared after gateway restarts.

## Node 22.16+ Floor

The supported Node 22 floor is now **22.16+**, required for the `node:sqlite` statement metadata API. Node 24 remains the recommendation. If you're pinned to an older Node 22 minor, this is your nudge to upgrade before the stable release lands.

## Install the Beta

```bash
npm install -g openclaw@2026.5.9-beta.1
```

Or pull the Docker image tagged `beta`. This is a pre-release — test it in a non-production environment first. The full changelog is on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.9-beta.1).
