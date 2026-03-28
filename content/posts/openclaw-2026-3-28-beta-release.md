---
title: "OpenClaw 2026.3.28 Beta: Plugin Approval Hooks, xAI Search, and 40+ Fixes"
excerpt: "OpenClaw's biggest beta of March lands tonight with plugin-level tool approval gates, xAI Responses API with x_search, MiniMax image generation, and 40+ bug fixes."
coverImage: '/assets/images/posts/openclaw-2026-3-28-beta-release.png'
date: '2026-03-28T23:00:00.000Z'
dateFormatted: March 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-28-beta-release.png'
---

OpenClaw `2026.3.28-beta.1` shipped at 22:25 UTC tonight, and it's a dense one. The changelog clocks in at 40+ entries spanning breaking changes, new provider integrations, platform improvements, and a wave of bug fixes that have been collecting since the stable `2026.3.25` release. Here's what you actually need to know.

## Breaking Changes First

Two breaking changes landed in this beta. Act accordingly before upgrading production setups.

**Qwen portal-auth is gone.** The deprecated OAuth integration with `portal.qwen.ai` has been removed entirely. If you're using Qwen, migrate to Model Studio via `openclaw onboard --auth-choice modelstudio-api-key`. The old flow won't work after this release. ([#52709](https://github.com/openclaw/openclaw/pull/52709))

**Config migration cutoff.** OpenClaw's `doctor` command no longer auto-migrates config keys older than two months. Anything prehistoric in your `openclaw.json` will now fail validation instead of being silently rewritten. Run `openclaw doctor --fix` on a supported release *before* upgrading if your config is old.

## The Headline Features

### Plugin Tool Approval Gates

This is the most significant new capability in the release. Plugins can now implement an async `requireApproval` callback on `before_tool_call` hooks — which pauses tool execution and prompts the user to approve or deny the action before it runs. ([#55339](https://github.com/openclaw/openclaw/pull/55339))

The approval surface is multi-platform: it works via the exec approval overlay in the CLI, Telegram inline buttons, Discord interactions, or the `/approve` command on any channel. The `/approve` command itself has been unified to handle both exec and plugin approvals with automatic fallback.

This is a big deal for security-conscious deployments. Plugins that write files, call external APIs, or run shell commands can now require explicit human sign-off on every invocation — not just during initial setup.

### xAI Responses API and x_search

The bundled xAI provider has been migrated to the Responses API, gaining first-class support for the `x_search` tool. If you have Grok authentication configured, web search now works automatically without manual plugin toggles. ([#56048](https://github.com/openclaw/openclaw/pull/56048))

### MiniMax Image Generation

MiniMax can now generate images via the `image-01` model, with support for both text-to-image and image-to-image editing including aspect ratio control. The model catalog has also been trimmed to M2.7 only — if you were using M2, M2.1, M2.5, or VL-01, those are gone. ([#54487](https://github.com/openclaw/openclaw/pull/54487))

### ACP Current-Conversation Binds

Discord, BlueBubbles, and iMessage now support `current-conversation` ACP binds. Running `/acp spawn codex --bind here` will turn the current chat into a Codex-backed workspace without spawning a child thread. The docs have been updated to clarify the distinction between chat surface, ACP session, and runtime workspace.

### Slack Upload File Action

A new explicit `upload-file` Slack action routes file uploads through the Slack upload transport, with optional filename, title, and comment overrides for channels and DMs. Teams and Google Chat got equivalent support in the same PR, plus BlueBubbles file sends now route through `upload-file` with the legacy `sendAttachment` alias preserved.

## Notable Fixes

The fix list is long. Some highlights:

- **Gemini 3.1 models** — Flash, Pro, and Flash-Lite now resolve correctly across all Google provider aliases ([#56567](https://github.com/openclaw/openclaw/pull/56567))
- **WhatsApp echo loop** — Fixed an infinite loop in self-chat DM mode where the bot's own replies were re-processed as new inbound messages ([#54570](https://github.com/openclaw/openclaw/pull/54570))
- **Telegram long message splitting** — Replaced the old proportional text estimator with verified HTML-length search, so long messages now split at actual word boundaries ([#56595](https://github.com/openclaw/openclaw/pull/56595))
- **Discord reconnect** — Stale gateway sockets and poisoned resume state no longer cause Discord to loop on failed reconnects ([#54697](https://github.com/openclaw/openclaw/pull/54697))
- **iMessage reply tags** — The `[[reply_to:...]]` inline tags that were leaking into delivered iMessage text are now stripped correctly ([#39512](https://github.com/openclaw/openclaw/pull/39512))
- **Control UI config reveal** — Sensitive raw config is now hidden by default again, with an explicit reveal-to-edit state instead of the blank blocked editor that shipped in an earlier release

## Security Notes

Two security-relevant fixes made it into this beta:

The **security key audit** now recognizes Gemini, Grok/xAI, Kimi, Moonshot, and OpenRouter credentials — previously only a subset of providers were scanned during the web-search key audit. ([#56540](https://github.com/openclaw/openclaw/pull/56540))

The **media dispatch sandbox bypass** fix from `2026.3.24` was carried forward — the `mediaUrl`/`fileUrl` alias that could escape media-root restrictions is closed.

## Should You Upgrade?

This is a beta. For production setups, wait for the stable release unless you specifically need the xAI Responses API or the plugin approval hooks. For dev/staging environments or adventurous self-hosters, the build is solid and the changelog is worth reading in full on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.3.28-beta.1).

The two breaking changes (Qwen portal-auth removal and old config migration cutoff) require action before upgrading. Check both before you `npm install -g openclaw@beta`.
