---
title: "OpenClaw v2026.5.26 Stable: Transcripts, Faster Gateway, and Six Security Fixes"
excerpt: "OpenClaw v2026.5.26 lands as stable with transcript-backed meeting summaries, major Gateway performance gains, and six security patches including SSRF and prompt-injection fixes."
coverImage: '/assets/images/posts/openclaw-2026-5-27-v2026526-stable-release.png'
date: '2026-05-27T23:00:00.000Z'
dateFormatted: May 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-27-v2026526-stable-release.png'
---

After a two-beta stabilization cycle, **OpenClaw v2026.5.26** graduated to stable today at 11:27 UTC — bringing one of the project's larger shipping weeks to a close. The release spans eight headline areas: transcripts, performance, voice/Talk, channel reliability, mobile, security, observability, and install hardening.

## Transcripts Are Now a First-Class Feature

The biggest new capability in this release is **transcript capture**. OpenClaw can now record session transcripts with source-provider chunks, cleaned user turns, and media provenance — enabling transcript-backed meeting summaries via a new `Transcripts` CLI surface. WebChat replies, Codex mirrors, and CLI/TUI replay all route through a single, more reliable transcript path. If you run OpenClaw in team or meeting contexts, this is the feature to check out first.

## Gateway Startup and Reply Speed

Performance improvements touch several hot paths:

- **Metadata caching**: plugin snapshots, package realpaths, model cost indexes, channel resolution, and auth facts are now cached so common Gateway and reply paths skip expensive rediscovery on each turn.
- **Lazy loading**: slash-command startup metadata, context compaction, and warning imports are deferred so the Gateway boot path avoids work it doesn't immediately need.
- **Visible reply separation**: user-facing sends are now decoupled from slower follow-up work, reducing perceived reply latency. One contributor ([`@keshavbotagent`](https://github.com/keshavbotagent)) landed six targeted fixes for this in PRs #86989–#86994.

## Channel Reliability

Every major channel got fixes in this cycle:

- **Telegram**: text entities preserved, forum topics retained, DM overlaps fixed, typing/progress context kept alive.
- **iMessage**: image attachments read from `~/Library/Messages/Attachments`, duplicate local sources deduplicated, slash-command acknowledgements routed back to source conversation.
- **WhatsApp**: group-drop warnings and ack identity restored.
- **Discord**: voice playback improved, large model-picker menus now use alphabetic buckets (e.g. "A–G (12) · H–N (18)") instead of paginated prev/next. Thanks [`@rendrag-git`](https://github.com/rendrag-git).
- **Signal/iMessage/WhatsApp**: all three now support reaction-based approval (👍 to approve, no `/approve` text needed). PR #85894, #85952, #85477.

## Mobile: Android Pairing + iOS Realtime Talk

Two mobile improvements stand out:

- **Android**: A new "pair new gateway" action makes onboarding a second device much smoother. PR #86798.
- **iOS**: Realtime Talk mode now runs direct voice sessions with compact toolbar status and a responsive waveform visualizer. PR #86355. Thanks [`@ngutman`](https://github.com/ngutman).

## Six Security Fixes

This release patches a notable cluster of security issues — all credited to community researchers:

1. **Prompt injection in `memory_store`**: text resembling prompts is now rejected before embedding/storage, matching the existing auto-capture filter. PR #87142.
2. **Auth rate limiter**: the default rate limiter now fires for remote non-browser HTTP auth failures even when `gateway.auth.rateLimit` is unset. PR #87148.
3. **Browser SSRF**: `Browser snapshot` tab URLs are now validated against SSRF policy before ChromeMCP or CDP reads. PR #78526. Thanks [`@zsxsoft`](https://github.com/zsxsoft).
4. **System-event prompt spoofing**: queued system-event text is sanitized so untrusted plugin/channel labels cannot inject nested prompt markers. PR #87094. Thanks [`@ttzero25`](https://github.com/ttzero25).
5. **File-fetch wrapping**: text fetched from external files is now wrapped as external content. PR #87062. Thanks [`@mmaps`](https://github.com/mmaps).
6. **Stale device tokens**: RPCs from clients with invalidated device tokens are rejected during token rotation. PR #70707.

## Other Notable Changes

- **Rastermill replaces Sharp**: image metadata, resizing, EXIF orientation, and PNG alpha-preserving optimization now use [Rastermill](https://github.com/openclaw/openclaw/pull/86437), dropping the Sharp dependency entirely. PR #86437.
- **Activity tab in Control UI**: a new ephemeral Activity tab shows live sanitized tool activity without persisting raw telemetry. Fixes [#12831](https://github.com/openclaw/openclaw/issues/12831). Thanks [`@BunsDev`](https://github.com/BunsDev).
- **Cron parallelism**: `cron.maxConcurrentRuns` now defaults to 8, so scheduled automations can run in parallel without explicit config.
- **Named auth profiles**: Hermes, OpenCode, and Codex auth profiles now support named model login with credential migration and explicit opt-out. PR #85667. Thanks [`@fuller-stack-dev`](https://github.com/fuller-stack-dev).
- **OpenTelemetry LLM spans**: new content spans for LLM calls, plus alertable telemetry for blocked tools, failover, stale sessions, and oversized payloads. PR #83019.
- **Codex 0.134.0**: bundled Codex CLI updated; native compaction disabled for budget-triggered app-server turns so OpenClaw owns the recovery boundary.

## How to Update

```bash
openclaw update
```

Full release notes are on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.26).
