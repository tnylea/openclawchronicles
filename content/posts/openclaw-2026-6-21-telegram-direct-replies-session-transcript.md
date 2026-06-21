---
title: "OpenClaw Fixes Telegram Direct Reply Context"
excerpt: "OpenClaw now uses canonical session transcripts for Telegram direct replies, reducing stale cross-channel context during approvals."
coverImage: '/assets/images/posts/openclaw-2026-6-21-telegram-direct-replies-session-transcript.png'
date: '2026-06-21T23:01:00.000Z'
dateFormatted: June 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-21-telegram-direct-replies-session-transcript.png'
---

OpenClaw merged a high-priority Telegram fix just before the nightly cutoff: direct Telegram replies in shared sessions can now build recent prompt context from the canonical session transcript instead of relying only on Telegram's per-chat cache.

The change landed in [PR #95390](https://github.com/openclaw/openclaw/pull/95390), which fixes issue #95378. The user impact is straightforward: if someone continues the same OpenClaw session from another surface, such as gateway or iOS, and then answers an ambiguous prompt from Telegram, the reply should be interpreted against the freshest shared session state.

## Why This Matters

Telegram has become one of the most common OpenClaw control surfaces because it is fast, familiar, and available from a phone. That convenience becomes risky when the same long-running session also receives turns from other transports.

Before this fix, a direct Telegram reply could be assembled from Telegram's local chat cache even when the canonical session transcript already contained newer turns from another channel. In the worst case, an approval or clarification could bind to an older proposal rather than the current one.

That is exactly the kind of bug that matters in agent systems. The text of the message may look harmless, but the surrounding context decides what action the agent thinks the user approved.

## What Changed

The PR adds a bounded transcript reader and exposes it through the plugin SDK so Telegram prompt assembly can read recent canonical session turns. It filters entries before the current Telegram turn and keeps the existing prompt-reset boundary.

The scope is intentionally narrow:

- Direct Telegram sessions prefer canonical transcript recency when available.
- Group, supergroup, forum-topic, mention-filter, and reply-target behavior stay on existing Telegram cache boundaries.
- If transcript lookup fails, Telegram falls back to the previous cache path.
- Transcript storage format, migrations, routing, and non-Telegram prompt construction are unchanged.

The PR also preserves topic-enabled private chat session keys and filters transcript-only OpenClaw assistant bookkeeping rows before exposing prompt-visible context.

## Proof And Risk

The authors reported focused Vitest coverage for session transcript recency, topic-enabled DM session keys, Telegram prompt-context mapping, message cache behavior, and plugin SDK surface checks. They also cited live Telegram Desktop proof from a Mantis run.

The merged diff is substantial enough to deserve attention: 749 additions across 11 files. Still, the design is conservative. It moves direct Telegram context toward the session source of truth without merging raw per-transport caches or changing group privacy semantics.

For operators, the practical takeaway is simple. Shared sessions that hop between mobile, gateway, and Telegram should be less likely to answer yesterday's prompt by accident.

