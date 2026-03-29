---
title: "OpenClaw v2026.3.28 Stable: Plugin Hooks and MiniMax Images"
excerpt: "OpenClaw v2026.3.28 is out with plugin approval hooks for tool gating, MiniMax image generation, xAI Responses API, and breaking Qwen auth changes."
coverImage: '/assets/images/posts/openclaw-2026-3-29-stable-release.png'
date: '2026-03-29T08:00:00.000Z'
dateFormatted: March 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-29-stable-release.png'
url: '/posts/openclaw-2026-3-29-stable-release/'
---

OpenClaw v2026.3.28 stable dropped early Sunday morning, graduating from Friday's beta with a hefty changelog. This is a release you'll want to read carefully — there are two breaking changes, a handful of significant new features, and a solid wave of bug fixes across Telegram, Discord, WhatsApp, and BlueBubbles.

## Breaking Changes — Read These First

**Qwen portal auth is gone.** The deprecated `qwen-portal-auth` OAuth integration for `portal.qwen.ai` has been removed. If you're using Qwen, migrate to Model Studio with `openclaw onboard --auth-choice modelstudio-api-key`. This was deprecated for a while, but the axe has now fallen.

**Config Doctor drops old migrations.** Automatic config migrations older than two months are no longer applied. Very old legacy config keys now fail validation rather than being silently rewritten on load or by `openclaw doctor`. If you're running a very old config, audit it before upgrading.

## Plugin Approval Hooks — Gate Any Tool Call

The standout feature in this release is `requireApproval` for `before_tool_call` hooks ([#55339](https://github.com/openclaw/openclaw/pull/55339)). Plugins can now pause tool execution mid-run and request explicit user approval through whatever channel is active — the exec approval overlay, Telegram inline buttons, Discord interactions, or the `/approve` command.

This is a meaningful upgrade for anyone building agents that interact with sensitive systems. You can now wrap any tool call in an approval gate without patching core logic. The `/approve` command itself has been updated to handle both exec and plugin approvals with automatic fallback.

## MiniMax Image Generation

MiniMax gets image generation support via the `image-01` model ([#54487](https://github.com/openclaw/openclaw/pull/54487)), with both text-to-image and image-to-image editing, plus aspect ratio control. The model catalog has been trimmed at the same time — M2, M2.1, M2.5, and VL-01 are gone; M2.7 is the only MiniMax model going forward.

## xAI / Grok Gets a Proper Responses API Integration

The bundled xAI provider has been moved to the Responses API ([#56048](https://github.com/openclaw/openclaw/pull/56048)), and `x_search` is now a first-class tool. The xAI plugin also auto-enables from owned web-search and tool config, so Grok auth and configured search flows work without manually toggling plugin entries. The onboarding flow for Grok web-search has been updated to match.

## ACP Gets In-Place Conversation Binding

A subtle but powerful addition: `/acp spawn codex --bind here` now works on Discord, BlueBubbles, and iMessage, turning the current chat into a Codex-backed workspace without spawning a child thread. The docs have been updated to clarify the distinction between chat surface, ACP session, and runtime workspace.

## Slack File Uploads and Cross-Platform File Sends

A new `upload-file` Slack action routes file uploads through the existing Slack transport with optional filename, title, and comment overrides. Microsoft Teams and Google Chat also now have explicit `upload-file` support as part of a broader push to unify file sends across channels. BlueBubbles file sends are exposed through `upload-file` as well (with the legacy `sendAttachment` alias preserved).

## Notable Fixes

A few fixes worth calling out specifically:

- **Anthropic unhandled stop reasons** ([#56639](https://github.com/openclaw/openclaw/pull/56639)): Provider stop reasons like `sensitive` now surface as structured assistant errors instead of crashing the run.
- **Gemini 3.1 resolution** ([#56567](https://github.com/openclaw/openclaw/pull/56567)): Pro, Flash, and Flash-lite now resolve correctly across all Google provider aliases.
- **WhatsApp echo loop** ([#54570](https://github.com/openclaw/openclaw/pull/54570)): Fixed an infinite loop in self-chat DM mode where the bot's own replies were being re-processed as new inbound messages.
- **Discord reconnect loop** ([#54697](https://github.com/openclaw/openclaw/pull/54697)): Stale gateway sockets are now properly drained before forced reconnects, stopping the poisoned-resume-state loop.
- **Telegram message splitting** ([#56595](https://github.com/openclaw/openclaw/pull/56595)): Long messages now split at word boundaries using verified HTML-length search instead of proportional estimates.

## Other Changes Worth Noting

- `openclaw config schema` is a new CLI command that prints the generated JSON schema for `openclaw.json` ([#54523](https://github.com/openclaw/openclaw/pull/54523)).
- Matrix TTS replies are now sent as native Matrix voice bubbles instead of generic audio attachments ([#37080](https://github.com/openclaw/openclaw/pull/37080)).
- `apply_patch` is now enabled by default for OpenAI and OpenAI Codex models.
- The minimum supported Node 22 version drops to 22.14+ (Node 24 still recommended).
- Tavily API requests are now tagged with `X-Client-Source: openclaw` for attribution.

## Upgrade

```bash
npm update -g openclaw
```

Full changelog and release notes are on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.3.28).
