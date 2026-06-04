---
title: "OpenClaw v2026.5.12-beta.6: Gateway v4 Protocol, Copilot Image Fixes, and Cron Inspection API"
excerpt: "OpenClaw beta.6 ships the Gateway v4 protocol requirement, Copilot OAuth token exchange for image requests, a new cron.get API, and a dozen targeted fixes."
coverImage: '/assets/images/posts/openclaw-2026-5-13-beta6-release.webp'
date: '2026-05-13T23:00:00.000Z'
dateFormatted: May 13th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-13-beta6-release.webp'
---

OpenClaw shipped `v2026.5.12-beta.6` tonight at 21:00 UTC — the sixth beta in the current release cycle and the most wide-ranging yet. It touches the Gateway protocol layer, provider integrations, iMessage, cron tooling, and agent orchestration limits. Here's what changed.

## Gateway Protocol v4 Is Now Required

The headline infrastructure change: the Gateway now **requires v4 clients** ([#80725](https://github.com/openclaw/openclaw/pull/80725), by [@samzong](https://github.com/samzong)) and streams explicit `deltaText` and `replace` frames on chat sessions. This means SDK clients can consume assistant content updates as they arrive — without implementing local text-diffing logic.

If you're building on the OpenClaw SDK, this is the change to act on before the stable release lands. The old implicit-diff behavior is gone; clients that haven't adopted v4 will need to update.

## GitHub Copilot: Image Understanding Fixed

A meaningful fix for anyone using OpenClaw with GitHub Copilot: the gateway now **exchanges OAuth tokens for Copilot API tokens** on image understanding requests and routes Gemini image payloads correctly through Chat Completions. The practical result: Copilot-backed Gemini image descriptions now work correctly after previously silently failing.

## iMessage: No More `<media:image>` Placeholder Text

A community-reported bug ([#81209](https://github.com/openclaw/openclaw/pull/81209), by [@homer-byte](https://github.com/homer-byte)): iMessage was sending the literal string `<media:image>` as visible text when the agent sent media-only messages. The fix preserves the internal echo-deduplication key while stripping the placeholder from outbound content — so image-only sends now deliver cleanly.

## New Cron Inspection API: `cron.get`

Operators running scheduled agent workflows get a new tool: **`cron.get`** ([#75117](https://github.com/openclaw/openclaw/pull/75117), by [@samzong](https://github.com/samzong)). You can now inspect a single stored cron job by ID via:

- `cron.get` agent tool
- `openclaw cron get <id>` CLI command
- Direct tool call from inside an agent session

This fills an obvious gap — previously you could list cron jobs but couldn't easily drill into one without parsing the full list output.

## Agent-to-Agent Sessions Pre-Created

A reliability fix for multi-agent setups: configured agent main sessions are now **created before the first `sessions_send` or gateway send**. Previously, if Agent A tried to message Agent B before B had started a session, the send would fail. Beta.6 removes that ordering requirement — agents can now receive messages without having been active first.

## maxPingPongTurns Raised to 20

`session.agentToAgent.maxPingPongTurns` can now be configured up to **20** ([#52400](https://github.com/openclaw/openclaw/pull/52400), by [@thirumaleshp](https://github.com/thirumaleshp)), up from the previous hardcap of 5. The default remains 5, so existing installations are unaffected — but complex agent-to-agent workflows that needed longer back-and-forth chains can now configure accordingly.

## Gateway Now Honors `max_completion_tokens`

The Gateway's OpenAI-compatible HTTP endpoint now properly **forwards `max_completion_tokens` and `max_tokens`** from inbound `/v1/chat/completions` requests to upstream providers via `streamParams.maxTokens`. When both are sent, `max_completion_tokens` takes precedence. Contributed by [@Lellansin](https://github.com/Lellansin) — a fix that matters for any SDK or client that sends token budget hints.

## OpenAI CLI Auth Default Changes

`openclaw models auth login --provider openai` now **starts the ChatGPT/Codex account login flow by default** instead of prompting for an API key. The explicit API-key path remains available via `--method api-key`. This aligns the default with how most new users are authenticating.

## Gemini 3.1 Pro Preview: ID Normalization Complete

A comprehensive sweep across every auth code path — SDK OAuth, direct `auth login --set-default`, API-key onboarding, per-agent config, proxy-prefixed catalog rows — now consistently emits `google/gemini-3.1-pro-preview` for Gemini 3.1 testing. No more manually correcting model IDs after auth flows.

## fal Provider: Image Edit Mode Improvements

GPT Image 2 and Nano Banana 2 reference-image edit requests are now correctly routed to `/edit` with an `image_urls` array ([#77295](https://github.com/openclaw/openclaw/issues/77295), by [@leoge007](https://github.com/leoge007)). Input-image caps are lifted to 10 for GPT Image 2 and 14 for Nano Banana 2. Aspect-ratio hints are now supported in edit mode.

## Control UI Recovery Panel

A fallback for blank dashboard pages: when the app module never registers (usually a browser-extension conflict or stale cache), the Control UI now shows a **plain HTML recovery panel** with a retry path and troubleshooting link. Fixes a longstanding [#44107](https://github.com/openclaw/openclaw/issues/44107).

## Upgrading

`v2026.5.12-beta.6` is a pre-release. Install or update with:

```bash
npm install -g openclaw@latest
```

Full release notes are on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.12-beta.6). If you're running the beta channel and building on the OpenClaw SDK, the Gateway v4 protocol requirement is the change to prioritize before the stable release.
