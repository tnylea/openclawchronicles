---
title: "OpenClaw v2026.5.31-beta.4: MiniMax M3, iPad Layouts, and SQLite-Backed State"
excerpt: "OpenClaw v2026.5.31-beta.4 is out with MiniMax M3 support, native iPad layouts, SQLite-backed channel state, doctor disk checks, and key provider reliability fixes."
coverImage: '/assets/images/posts/openclaw-2026-6-1-beta4-release.png'
date: '2026-06-01T08:00:00.000Z'
dateFormatted: June 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-1-beta4-release.png'
---

OpenClaw shipped its second beta of the day in the early hours of June 1st: **v2026.5.31-beta.4**. While beta.3 (covered yesterday) already delivered the Skill Workshop, Copilot/Tokenjuice plugin externalization, and iOS Talk improvements, beta.4 layers on a meaningful round of model expansion, platform polish, and backend durability work. Here's what changed.

## MiniMax M3 Joins the Provider Roster

The most headline-ready addition in beta.4 is first-class support for **MiniMax M3** ([#88860](https://github.com/openclaw/openclaw/pull/88860)). MiniMax has been building quietly in the multimodal space and M3 is their most capable model yet. You can now point any OpenClaw agent at MiniMax M3 via the provider selector in `~/.openclaw/openclaw.json` — no extra plugins needed. The same release also ships MiniMax account OAuth endpoints so credentials round-trip cleanly through the provider auth flow.

Beyond MiniMax, this beta rounds out provider metadata across the board: Google/Vertex static catalog rows are fixed, OpenRouter now caches its model catalog in SQLite (faster cold starts), Copilot picks up Claude 1M context capabilities, and Foundry's reasoning alignment is corrected. A long-standing issue with OpenAI Responses ID replay ([#88480](https://github.com/openclaw/openclaw/issues/88480)) is also patched, which was causing duplicate tool calls in certain multi-turn sessions.

## Native iPad Layouts

iOS users on iPad have been running OpenClaw in a letterboxed iPhone layout for a while. Beta.4 fixes that: the iOS app now uses **native iPad display layouts**, adapting to larger screens with proper split-view awareness. It's a welcome quality-of-life upgrade if you use an iPad as a primary surface for remote agent sessions.

## SQLite Takes Over More State

Beta.4 continues OpenClaw's multi-release migration away from filesystem-scattered state toward **SQLite-backed stores** that survive restarts cleanly:

- **iMessage monitor state** moves to SQLite, so iMessage sessions no longer need to re-scan the filesystem on restart ([#88797](https://github.com/openclaw/openclaw/pull/88797))
- **Inbound channel queues** are now SQLite-backed, reducing the chance of lost or duplicate inbound messages during gateway restarts ([#88797](https://github.com/openclaw/openclaw/pull/88797))
- **Plugin install index** is persisted in SQLite, so `openclaw plugins list` no longer triggers a full filesystem sweep on every call ([#88794](https://github.com/openclaw/openclaw/pull/88794))
- **Voice call logs** migrate through `openclaw doctor` into plugin-state SQLite, with a graceful path for malformed or partial legacy records ([#88731](https://github.com/openclaw/openclaw/pull/88731))

The net effect: gateways that restart — planned or otherwise — come back faster and with less duplicate-delivery noise.

## Doctor Adds Disk Space Checks

`openclaw doctor` now includes **disk space health checks**, flagging gateways running low on storage before they hit a write failure. The same update stabilizes post-upgrade JSON probes, which were occasionally producing false negatives on non-standard installations.

## Control UI: Communication Notifications and Dreaming Agent Selector

Two Control UI features that have been in progress for a while are now wired up:

- The **Communication Notifications settings tab** is reachable from the settings panel ([#74715](https://github.com/openclaw/openclaw/pull/74715)), so you can configure notification behavior without touching the JSON config directly.
- The **Dreaming tab** now has an agent selector that propagates through Dreaming status, diary entries, and diary actions ([#78748](https://github.com/openclaw/openclaw/pull/78748)), making it much easier to manage per-agent dream state in multi-agent setups.

Chat in the Control UI also gets incremental streaming — delta chunks render as they arrive rather than waiting for the full response, and the composer controls are calmer during active message entry ([#88772](https://github.com/openclaw/openclaw/pull/88772), [#88825](https://github.com/openclaw/openclaw/pull/88825)).

## Plugin SDK: Typed Presentation Commands

A more technical addition: the Plugin SDK now supports **typed presentation command actions** ([#88721](https://github.com/openclaw/openclaw/pull/88721)). This lets native slash-command and callback controls round-trip through capable channel plugins without being reinterpreted as plain text. If you're building channel plugins that surface interactive commands, this is the piece that lets your buttons stay buttons on platforms like Discord and Telegram.

## Media: Text File Sends Now Supported

A small but useful fix: OpenClaw agents can now **send TXT, JSON, YAML, and YML files as host-local documents** ([#79658](https://github.com/openclaw/openclaw/pull/79658)) — while still rejecting binary-disguised text files. This opens up agent-to-agent and agent-to-human file passing for structured data formats without needing to wrap everything in a code block.

## How to Update

```bash
npm install -g openclaw@latest
openclaw doctor
```

The full beta.4 changelog is on the [OpenClaw releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.31-beta.4).
