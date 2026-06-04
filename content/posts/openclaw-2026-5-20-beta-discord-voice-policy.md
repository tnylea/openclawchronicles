---
title: "OpenClaw v2026.5.20 Beta: Discord Voice Follow Mode, Policy Plugin, and xAI OAuth"
excerpt: "OpenClaw v2026.5.20-beta.1 lands Discord voice follow mode, SOUL.md-aware voice sessions, a bundled Policy plugin, and headless xAI OAuth login."
coverImage: '/assets/images/posts/openclaw-2026-5-20-beta-discord-voice-policy.webp'
date: '2026-05-21T08:00:00.000Z'
dateFormatted: May 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-20-beta-discord-voice-policy.webp'
---

OpenClaw's latest pre-release, **v2026.5.20-beta.1**, dropped early this morning and it's a meaty one. The headline feature is a long-requested Discord improvement — the ability for voice sessions to automatically follow configured users into voice channels — but there's plenty more packed in, including a brand-new Policy plugin and a cleaner auth story for xAI on headless machines.

Here's what's new.

## Discord Voice Follow Mode

Voice sessions can now follow configured Discord users as they move between voice channels. When a tracked user joins or switches channels, OpenClaw's voice session follows along automatically, with proper allowed-channel checks and multi-user handoff so you don't end up with a runaway bot crashing unrelated rooms ([#84264](https://github.com/openclaw/openclaw/pull/84264), thanks @fuller-stack-dev).

Paired with this is DAVE recovery preservation — OpenClaw maintains Discord's end-to-end encryption state for audio even through follow transitions, which matters for anyone relying on Discord's E2E voice encryption.

## Voice Sessions Now Know Who You Are

Until now, realtime voice sessions ran with minimal context about your agent's identity. That changes in v2026.5.20: the contents of `IDENTITY.md`, `USER.md`, and `SOUL.md` are now included in realtime voice session instructions by default ([#84499](https://github.com/openclaw/openclaw/pull/84499)).

If you've put effort into defining your agent's persona and knowing your own preferences, that work now carries into voice conversations — no extra configuration needed. For users who want a leaner session or have privacy concerns, the new `voice.realtime.bootstrapContextFiles: []` config key lets you disable it entirely.

## The Policy Plugin Is Now Bundled

OpenClaw's new **Policy plugin** ships as a first-class bundled plugin in this release ([#80407](https://github.com/openclaw/openclaw/pull/80407), thanks @giodl73-repo). It adds:

- **Policy-backed channel conformance checks** — validate that channel behavior matches declared policy rules
- **Doctor lint findings** — `openclaw doctor` now surfaces policy violations alongside the usual config issues
- **Opt-in workspace repair** — the doctor's `--fix` mode can apply policy-compliant corrections automatically

This is particularly relevant for multi-agent and team setups where you need guardrails on what different agents or channels are allowed to do.

## xAI Device-Code OAuth for Headless Installs

Running OpenClaw on a VPS or remote server without a browser? Previously, authorizing xAI required a localhost browser callback — not practical on headless machines. v2026.5.20 adds **device-code OAuth login** for xAI ([#84005](https://github.com/openclaw/openclaw/pull/84005), thanks @fuller-stack-dev), so you get a short code you can complete on any device, same pattern as GitHub CLI or Tailscale. Remote and Docker installs no longer need browser forwarding tricks.

## OpenRouter Provider Routing Policy

OpenRouter users get more control: provider-level `params.provider` routing policies are now honored for OpenRouter requests, with model and agent params able to override defaults (thanks @amknight). This lets you pin specific upstream providers or load-balance across them without OpenRouter's automatic routing taking over.

## Per-Agent Lean Local Model Mode

A small but useful config addition: `agents.list[].experimental.localModelLean` lets you enable lean local-model mode for a single configured agent instead of flipping it globally. Helpful if you have a lightweight agent running local models alongside heavier cloud-backed agents in the same Gateway.

## Notable Fixes

A few fixes worth calling out:

- **Cron chat blocking fixed**: scheduled cron work now runs on a dedicated wake lane, so background jobs no longer block your main-session chat ([#82767](https://github.com/openclaw/openclaw/pull/82767))
- **Docker Codex plugin preserved**: the bundled Codex plugin is now in Docker image keep lists so it survives pruning ([#83626](https://github.com/openclaw/openclaw/pull/83626))
- **Anthropic Claude 4 images restored**: a stale catalog row that was silently stripping image capability from Claude 4 models is fixed ([#83756](https://github.com/openclaw/openclaw/pull/83756))
- **WhatsApp: Baileys bumped to 7.0.0-rc12**

## Upgrading

As a pre-release, v2026.5.20-beta.1 is opt-in:

```bash
npm install -g openclaw@beta
```

Or follow the [upgrade guide](https://docs.openclaw.ai/start/upgrading) for daemon-based installs. The full changelog is on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.20-beta.1).
