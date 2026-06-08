---
title: "OpenClaw 2026.6.5-beta.5: Provider Fixes, Android Theme, Workboard Stability"
excerpt: "Beta.5 lands today with Ollama metadata fixes, Gemini path normalization, Android theme mode selection, and Workboard ghost row elimination. The stable release is close."
coverImage: '/assets/images/posts/openclaw-2026-6-8-v2026-6-5-beta5-whats-new.png'
date: '2026-06-08T23:30:00.000Z'
dateFormatted: June 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-8-v2026-6-5-beta5-whats-new.png'
---

OpenClaw pushed `v2026.6.5-beta.5` at 22:49 UTC tonight — the fifth pre-release on the 2026.6.5 train. If you've been tracking the earlier betas, we've already covered [Parallel bundled search](https://openclawchronicles.com/posts/openclaw-release-2026-6-5-parallel-search) and the [SQLite state durability migration](https://openclawchronicles.com/posts/openclaw-2026-6-7-sqlite-state-durability). Here's what beta.5 adds on top of those.

## Provider and Model Resolution: A Bundle of Targeted Fixes

[PR #91125](https://github.com/openclaw/openclaw/pull/91125) landed as a cleanup pass over several provider-specific edge cases that were causing subtle failures for specific setups:

**Ollama catalog metadata preserved.** Previous builds were dropping Ollama model metadata during catalog refresh, causing model lists to lose context-length and capability annotations. Fixed.

**Google provider prefixes stripped from Gemini paths.** If you're using the Google provider, model paths that included a redundant `google/` prefix were failing resolution. The prefix is now stripped at normalization time.

**Foundry Responses reasoning replay IDs survive.** Extended-thinking replay for Foundry users was breaking because reasoning replay IDs weren't surviving the session serialization round-trip. Fixed.

**MiniMax M3 thinking stays enabled.** MiniMax M3's thinking mode was being silently disabled during provider catalog hydration. Now preserved.

**Vertex multi-region calls use the correct regional host.** Vertex AI users routing to non-default regions were getting requests sent to the wrong regional endpoint. The regional host is now resolved from the configured region correctly.

**OpenRouter streamed generation cost reconciled.** Cost tracking for OpenRouter streaming completions was miscalculating when the stream ended with a non-final cost chunk. Reconciliation now happens correctly at stream close.

These are all targeted fixes for specific provider configurations. If you've been hitting mysterious failures with any of these providers, beta.5 is worth testing.

## Android Gets Theme Mode Selection

[PR #91201](https://github.com/openclaw/openclaw/pull/91201) adds a theme mode selection screen to the Android app. Users can now explicitly set light mode, dark mode, or follow system preference rather than being locked to system-default behavior.

This rounds out mobile settings parity — the iOS app has offered this for a while. Android users have been requesting it since the app launched.

## Workboard Ghost Row Elimination

[PR #86205](https://github.com/openclaw/openclaw/pull/86205) resolves a long-standing Workboard bug where optimistic user messages would disappear, jump positions, or linger as ghost rows during stale history reloads and `runId` reassignment windows.

The fix makes optimistic messages stable across the full lifecycle — they no longer vanish on a stale reload, jump to a different position when the `runId` is reassigned, or persist as ghost rows after an abort. The `message-tool send` path now correctly counts as a delivery event, which was a secondary cause of the ghost row problem.

## macOS Node: No More Surprise Session Churn

[PR #90815](https://github.com/openclaw/openclaw/pull/90815) fixes a macOS node behavior where the node would silently self-reconnect away from a healthy direct Gateway session. In practice, this meant users would occasionally find their macOS companion app had dropped to a new session without any visible error — just lost context.

The fix keeps macOS node mode anchored to a healthy direct Gateway session. Thanks [@vrurg](https://github.com/vrurg) for the report and fix.

## What to Expect Next

The release notes reference the "June 2026 floor at 2026.6.5" and the train has been running for several days now. With beta.5 out and the major features — Parallel search, SQLite migration, ClawHub GitHub-backed installs, extended-thinking recovery — all shipping cleanly, the stable `2026.6.5` release is within reach.

If you're running OpenClaw in production and waiting for stable, the beta.5 package is at `openclaw@2026.6.5-beta.5` on npm. The release evidence and CI report are linked in the [GitHub release notes](https://github.com/openclaw/openclaw/releases/tag/v2026.6.5-beta.5).
