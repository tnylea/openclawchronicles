---
title: "OpenClaw v2026.5.20: Discord Voice Follow, Policy Plugin, and xAI OAuth"
excerpt: "OpenClaw v2026.5.20 is out with Discord voice-follow for users, a bundled Policy plugin for channel compliance, and xAI device-code OAuth login."
coverImage: '/assets/images/posts/openclaw-2026-5-21-v2026520-release.webp'
date: '2026-05-21T23:00:00.000Z'
dateFormatted: May 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-21-v2026520-release.webp'
---

OpenClaw shipped its **v2026.5.20 stable release** today, rounding out a beta cycle that ran through two pre-release builds and landing a slate of Discord, policy, and provider improvements that most self-hosters have been waiting on.

## Discord Voice Sessions Now Follow You

The headline feature for Discord users is voice-follow: OpenClaw can now track a configured Discord user as they move between voice channels, handling multi-user handoff, bounded reconciliation, and DAVE recovery preservation automatically ([#84264](https://github.com/openclaw/openclaw/pull/84264), thanks `@fuller-stack-dev`).

Paired with that, voice realtime sessions now inject bounded profile context — `IDENTITY.md`, `USER.md`, and `SOUL.md` — into session instructions by default, so your agent's personality carries into voice without extra configuration. You can opt out by setting `voice.realtime.bootstrapContextFiles: []` ([#84499](https://github.com/openclaw/openclaw/pull/84499)).

## Bundled Policy Plugin

A new first-party **Policy plugin** ships in this release, providing policy-backed channel conformance checks, `doctor` lint findings, and opt-in workspace repair ([#80407](https://github.com/openclaw/openclaw/pull/80407)). This is the cleanest answer yet to "how do I enforce guardrails across all my channels without wiring custom logic." It shows up in `openclaw doctor` output immediately after upgrading.

## xAI Device-Code OAuth for Headless Setups

Users running OpenClaw on headless servers or remote VMs can now authorize xAI/Grok without needing a localhost browser callback. The new device-code OAuth flow ([#84005](https://github.com/openclaw/openclaw/pull/84005)) generates a short code you confirm in your browser elsewhere — the same pattern used by tools like GitHub CLI.

## OpenRouter Routing Policy

OpenRouter users gain `provider`-level routing policy support: you can now specify `params.provider` routing constraints on the provider config, with per-model and per-agent overrides taking precedence (thanks `@amknight`).

## Notable Fixes

- **Doctor warns on sandbox tool policy hiding MCP tools** before provider requests hit ([#84699](https://github.com/openclaw/openclaw/pull/84699)) — a fix that will save a lot of head-scratching for MCP users
- **Cron jobs no longer block main-session chat** — scheduled work now runs on a cron-owned wake lane ([#82767](https://github.com/openclaw/openclaw/pull/82767))
- **Symlinked credential files now fail closed** for Telegram, LINE, Zalo, IRC, and Nextcloud Talk tokens — a quiet but important security fix
- **Doctor warns when `openclaw.json` contains plaintext API keys** ([#84718](https://github.com/openclaw/openclaw/pull/84718))
- **Codex bundled harness bumped to @openai/codex 0.132.0** with refreshed model catalog docs
- **WhatsApp: Baileys updated to 7.0.0-rc12**

## How to Upgrade

```bash
openclaw update
```

Full changelog is on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.20).
