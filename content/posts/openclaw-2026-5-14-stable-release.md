---
title: "OpenClaw v2026.5.12: Telegram Resilience, ACP Fallbacks, and Security Hardening"
excerpt: "OpenClaw v2026.5.12 is the new stable release, delivering a Telegram reliability overhaul, ACP fallback backends, dependency slimming, and a broad security hardening pass."
coverImage: '/assets/images/posts/openclaw-2026-5-14-stable-release.png'
date: '2026-05-14T23:00:00.000Z'
dateFormatted: May 14th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-14-stable-release.png'
---

OpenClaw v2026.5.12 landed today as the new latest stable release, capping a rapid beta cycle that ran through eight pre-release builds over the past several days. The release covers a wide swath of improvements — from Telegram's long-overdue reliability overhaul to new ACP fallback logic, tighter security defaults, and UI polish across Control UI, WebChat, and the TUI.

Here's what matters most.

## Telegram Got a Serious Reliability Upgrade

Telegram has been one of OpenClaw's most popular channels, but it carried a fragility problem: event-loop stalls on the main gateway process could freeze Bot API polling entirely, causing missed messages and failed deliveries. v2026.5.12 fixes this at the architecture level.

Telegram ingress now runs in an **isolated worker thread** with a durable local spool ([#81746](https://github.com/openclaw/openclaw/pull/81746)). If the main gateway gets busy — running a long tool chain, compacting memory, anything blocking the event loop — the Telegram polling loop keeps ticking independently. Messages get spooled locally and processed once the gateway catches up, rather than silently dropped.

Two other Telegram fixes ship alongside this:

- **Group media handling** — OpenClaw now correctly skips downloading media from messages it should be ignoring (e.g. when `requireMention` is active), instead of attempting a failed download and replying with an error ([#81785](https://github.com/openclaw/openclaw/pull/81785)).
- **HTML formatting in cron deliveries** — Scheduled cron messages now preserve rendered HTML so Markdown links stay clickable instead of falling back to literal anchor tags ([#81758](https://github.com/openclaw/openclaw/pull/81758)).

## ACP Gets Fallback Backend Support

For users running ACP-backed agent sessions, v2026.5.12 introduces `acp.fallbacks` ([#69542](https://github.com/openclaw/openclaw/pull/69542)). When the primary ACP runtime backend is unavailable — a Codex server that's temporarily down, a remote agent endpoint unreachable — OpenClaw can now try configured backup runtimes before any output has been emitted to the user.

This makes ACP setups significantly more resilient for production-style workflows where agent availability matters. You configure fallbacks in your agent config and let the gateway handle recovery transparently.

## Two Security Improvements Worth Knowing

**Windows USERPROFILE sandbox** — OpenClaw's sandbox now includes `USERPROFILE` in its list of blocked home roots ([#63074](https://github.com/openclaw/openclaw/pull/63074)). On Windows, even when `HOME` points elsewhere, credential-bearing directories like `.codex`, `.openclaw`, or `.ssh` under the Windows user profile were previously accessible. That path is now closed.

**Provider credential isolation** — A subtle but important auth fix tightens how OpenClaw resolves API keys. Provider credentials are now only sourced from structured `SecretRefs` (`secrets.providers[id]` or `secrets.defaults`), not from broad environment variable pattern matching. Previously, any env var matching `^[A-Z_][A-Z0-9_]*$` could accidentally be inferred as a provider credential. That footgun is gone.

## UI Improvements

The **auto-scroll mode selector** in Control UI and WebChat ([#81287](https://github.com/openclaw/openclaw/pull/81287)) gives users three options: keep the existing near-bottom behavior, always follow streaming output, or turn automatic scroll off and use a "New messages" button manually. The preference persists across sessions.

**Session history monotonic sequencing** ([#81474](https://github.com/openclaw/openclaw/pull/81474)) fixes a race condition where stale SSE history could append out-of-order incremental state, causing visible duplication or missing messages in the chat history view. If you've ever seen ghost messages or jumbled history after a reconnect, this is the fix.

## Dependency Slimming

[As covered in this morning's post](https://openclawchronicles.com), Amazon Bedrock and Bedrock Mantle have moved to installable external packages. The same treatment applies to Slack, the OpenShell sandbox plugin, and Anthropic Vertex — all externalized to reduce the default install footprint. The result is a leaner core that doesn't pull AWS SDK, Slack SDK, or Anthropic Vertex dependencies unless you actually install those plugins.

## Upgrading

Update via `openclaw update` or `npm install -g openclaw@latest`. If you rely on Slack output, Amazon Bedrock, or Anthropic Vertex, install those plugins explicitly after upgrading:

```bash
openclaw plugins install @openclaw/slack
openclaw plugins install @openclaw/amazon-bedrock-provider
openclaw plugins install @openclaw/anthropic-vertex-provider
```

The full changelog is on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.12).
