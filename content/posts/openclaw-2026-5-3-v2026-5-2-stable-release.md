---
title: "OpenClaw v2026.5.2 Released: Plugin Overhaul, Grok 4.3, and SDK Tools API"
excerpt: "OpenClaw v2026.5.2 ships a plugin engine rewrite, Grok 4.3 as the new default xAI model, SDK tools.invoke, and fixes across Discord, Slack, and Telegram."
coverImage: '/assets/images/posts/openclaw-2026-5-3-v2026-5-2-stable-release.png'
date: '2026-05-03T08:00:00.000Z'
dateFormatted: May 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-3-v2026-5-2-stable-release.png'
---

OpenClaw v2026.5.2 landed late Friday night — and it's a meaty one. The stable release promotes what shipped across three beta builds this week: a significant plugin infrastructure rewrite, Grok 4.3 as the new default xAI model, a brand-new SDK tools.invoke API, and a wave of reliability fixes across Discord, Slack, Telegram, WhatsApp, and the Control UI. Over 200 contributors are credited.

Here's what's worth knowing.

## Plugin Engine Gets a Ground-Up Rework

The biggest theme of 2026.5.2 is the plugin system. On the ClawHub side, install and update flows now carry ClawPack metadata all the way through diagnostics, onboarding, doctor repair, and channel setup. Versioned ClawPack artifacts are preferred when available, response headers and downloaded bytes are verified, and digest metadata is persisted on install records so future registry refreshes don't need to re-fetch what they already know.

For CLI users, `openclaw plugins list --json` now includes package dependency install state — handy for scripts that need to spot missing plugin dependencies without triggering a full runtime load. First-class `git:` plugin installs also land in this release, complete with ref checkout, commit metadata, and `plugins update` support for git-sourced plugins.

On the runtime side, the plugin registry is now reused across startup and request time instead of being rebuilt on every turn. That means providers, tools, channel actions, and memory helpers all resolve from the same loaded registry — reducing startup overhead on plugin-heavy installs. Plugin tool descriptors are also cached after `api.registerTool()` so repeated prompt-time planning skips the runtime load entirely.

## Grok 4.3 Is Now the Default xAI Model

xAI's Grok 4.3 has been added to the bundled provider catalog and promoted to the default chat model for the xAI provider. If you have `providers.xai` configured, you'll get Grok 4.3 on the next run without any config changes.

## SDK Gets a tools.invoke RPC

Developers building on top of the Gateway SDK now have a `tools.invoke` RPC endpoint. It ships with shared HTTP policy, typed approval and refusal results, and SDK helper support. This is the foundation for external systems invoking agent tools programmatically — a capability that's been [requested for a while](https://github.com/openclaw/openclaw/issues/74705).

## Thread Bindings Simplified

The dual-toggle approach for subagent and ACP thread spawns is gone. It's been replaced by a single `threadBindings.spawnSessions` flag, defaulting to on. If you're upgrading from an older config, `openclaw doctor --fix` will migrate the legacy keys automatically. ([#75943](https://github.com/openclaw/openclaw/pull/75943))

## Channel Fixes Across the Board

**Discord**: Multi-step interactions — buttons, selects, and forms — now survive Gateway restarts until they naturally expire. Message-channel access groups land as well, letting allowlists reference a shared `accessGroup:` key across channel auth paths. ([#75813](https://github.com/openclaw/openclaw/pull/75813))

**Slack**: The App Home tab now renders a safe default view on `app_home_opened` instead of erroring. Bot-participated threads are tracked across restarts so auto-reply in threaded conversations continues after a Gateway upgrade. (Fixes [#11655](https://github.com/openclaw/openclaw/issues/11655))

**WhatsApp**: Explicit `@newsletter` outbound targets are now supported for WhatsApp Channel/Newsletter sends — previously these would fall through to DM routing. (Fixes [#13417](https://github.com/openclaw/openclaw/issues/13417))

**OpenAI-compatible TTS**: An `extraBody`/`extra_body` passthrough lands for TTS endpoints, so custom speech servers can now receive additional fields like `lang` in `/audio/speech` requests. (Fixes [#39900](https://github.com/openclaw/openclaw/issues/39900))

## Performance Wins Throughout

The release notes call out targeted optimizations across gateway startup, session listing, task maintenance, prompt prep, and large runtime config handling. A fast-path for POSIX path containment checks avoids repeated `path.resolve` and `path.relative` calls in hot filesystem walkers — a fix contributed by [@Enderfga](https://github.com/Enderfga) that touches a few long-standing issues ([#75895](https://github.com/openclaw/openclaw/issues/75895), [#75575](https://github.com/openclaw/openclaw/issues/75575)).

## macOS Menu Bar Cleanup

The macOS companion app gets a small UX tightening: recent session context rows are moved into a **Context** submenu while usage and cost details stay root-level. The result is a cleaner menu bar on installs with many active sessions. Thanks [@Guti](https://github.com/Guti).

## How to Upgrade

```bash
npm install -g openclaw@latest
openclaw doctor --fix
```

The `--fix` flag handles the thread binding migration automatically. Full release notes are on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.2).
