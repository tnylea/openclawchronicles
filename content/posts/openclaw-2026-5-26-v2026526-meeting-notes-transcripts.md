---
title: "OpenClaw v2026.5.26: Meeting Notes, Transcripts, and a Big Performance Overhaul"
excerpt: "OpenClaw v2026.5.26-beta.1 lands with a Meeting Notes plugin, Transcript support, Rastermill image backend, and sweeping performance and voice improvements."
coverImage: '/assets/images/posts/openclaw-2026-5-26-v2026526-meeting-notes-transcripts.webp'
date: '2026-05-26T23:00:00.000Z'
dateFormatted: May 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-26-v2026526-meeting-notes-transcripts.webp'
---

OpenClaw dropped `v2026.5.26-beta.1` tonight and it's a big one — 90+ changes spanning a brand-new Meeting Notes plugin, Transcript capture, a faster image backend, and a multi-layer performance push that touches almost every hot path in the Gateway.

## Meeting Notes and Transcripts Are Here

The headline feature is the new **Meeting Notes plugin**: a source-only external plugin that auto-captures meeting content and turns it into structured summaries. Discord voice is the first live capture source, with manual transcript imports supported from day one. The CLI gets a read-only `openclaw meeting-notes` command, and the whole thing runs outside the core npm package — meaning it doesn't add to install weight unless you need it.

Alongside this, OpenClaw now ships **core Transcript support** with a renamed Transcripts docs surface and CLI entry point. It's designed to back meeting summaries, but the source-provider contract is generic enough for future channels to plug in.

## Sharp Is Gone — Hello Rastermill

One of the more impactful under-the-hood changes: OpenClaw **replaces Sharp with Rastermill** for all image processing (metadata, resizing, EXIF orientation, PNG alpha-preserving optimization). The practical effect is that a standard OpenClaw install no longer pulls in Sharp or the WhatsApp Jimp fallback — leaner installs, fewer native build surprises. ([#86437](https://github.com/openclaw/openclaw/pull/86437))

## Gateway Performance Gets Serious

This release consolidates a substantial multi-PR performance push:

- **Plugin metadata caching** — snapshots are reused across startup, config, model, channel, setup, and secret paths instead of re-reading manifests on each hot-path call
- **Lazy-loading** — startup-idle plugin work, core method handlers, and the ACPX runtime are deferred so the Gateway reaches its health/ready signal faster
- **Channel catalog and session data** — cached process-locally so repeated reads during gateway operation hit memory, not disk
- **Reply delivery** — visible reply latency is cut by separating user-facing sends from slower follow-up work, deferring compaction maintenance, and lazy-loading slash-command startup metadata

## Voice and Talk Improvements

Real-time voice got a meaningful upgrade. While a consult is still running, **WebUI and Discord voice callers can now ask for status, cancel, steer, or queue follow-up work** — no more waiting for the agent to finish before you can redirect it. ([#84231](https://github.com/openclaw/openclaw/pull/84231))

Wake-name handling is also tighter: stricter ambient-speech filtering without breaking fuzzy wake phrases, plus a raised context budget for profiles with longer USER.md and SOUL.md files.

## Android, iOS, and Channel Updates

- **Android** gets a new pair-new-gateway action and improved Talk mode with offline voice/gateway recovery ([#86798](https://github.com/openclaw/openclaw/pull/86798))
- **iOS** gets direct realtime voice sessions in Talk mode with a compact toolbar and responsive waveform feedback ([#86355](https://github.com/openclaw/openclaw/pull/86355))
- **Signal, iMessage, and WhatsApp** all gain thumb-approval reactions — 👍 resolves allow-once, 👎 resolves deny — so mobile approval flows work without typing `/approve`
- **Discord's model picker** now buckets large provider lists into alphabetical segments (e.g., A–G · H–N · O–Z) when the list exceeds 25 items, keeping giant wildcard configs navigable in one click

## Activity Tab and Observability

The **Control UI gains an Activity tab** — an ephemeral, sanitized live summary of tool activity without persisting raw telemetry. ([#12831](https://github.com/openclaw/openclaw/issues/12831), thanks [@BunsDev](https://github.com/BunsDev)) Alongside this, OpenTelemetry LLM content spans, gateway secret-prep traces, and alertable signals for blocked tools, failover, stale sessions, and oversized payloads all land in this release.

## Cron Gets a Saner Default

Scheduled automations now have `cron.maxConcurrentRuns` defaulting to **8** instead of requiring explicit configuration. Multi-step cron jobs should behave more predictably out of the box.

## Named Model Auth Profiles

The `openclaw models auth login` command can now store a returned provider auth profile under a requested `--profile-id`, and Codex OAuth named profile setup is documented. A parallel PR ([#85667](https://github.com/openclaw/openclaw/pull/85667)) adds broader named model login profile support with credential migration for Hermes, OpenCode, and Codex auth profiles.

## Upgrade

The release is available now as a pre-release on npm:

```bash
npm install -g openclaw@2026.5.26-beta.1
```

Full changelog: [github.com/openclaw/openclaw/releases/tag/v2026.5.26-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.5.26-beta.1)
