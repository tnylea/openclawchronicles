---
title: "OpenClaw Fixes Telegram Forum Topic Routing in Async Flows"
excerpt: "PR #58489 resolves a longstanding bug where Telegram forum topic IDs were silently dropped in subagent announces, cron delivery, and session recovery paths."
coverImage: '/assets/images/posts/openclaw-2026-4-1-telegram-forum-topic-routing-fix.png'
date: '2026-04-01T08:00:00.000Z'
dateFormatted: April 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-1-telegram-forum-topic-routing-fix.png'
---

If you run OpenClaw on a Telegram forum group — the kind with distinct topic threads — you may have noticed an annoying behavior: agent responses triggered via subagents, cron jobs, or session recovery would sometimes land in the wrong topic, or drop into the General chat instead of the correct thread. [PR #58489](https://github.com/openclaw/openclaw/pull/58489) by [@cwmine](https://github.com/cwmine), merged April 1st, fixes this comprehensively.

## What Was Breaking

The bug was not in the Telegram provider itself — that layer was already correct. The problem lived upstream, in how OpenClaw's core persisted, merged, and reconstructed Telegram route state across four separate code paths.

Here is what was going wrong:

**Route persistence** — When a user sent a message in a forum topic, OpenClaw stored the last-known route in `lastTo`. For forum groups, this field was only set to the bare chat ID — the `threadId` identifying the specific topic was not encoded into the stored value. After a restart or session reload, the topic context was simply gone.

**Subagent announce routing** — When a subagent completed its work and OpenClaw tried to announce the result back to the original channel, the code unconditionally stripped the `threadId` from the announce entry. This was meant to handle a legitimate case (avoid routing a cross-chat announce to the wrong thread), but the logic was too blunt: it discarded the thread even for same-chat announces.

**Legacy cron delivery** — All four legacy cron payload helpers (`build`, `patch`, `merge`, `strip`) were not propagating `threadId` at all.

**Session delivery reconstruction** — `extractDeliveryInfo()` was not populating `deliveryContext.threadId` from any of its available fallback sources.

## What the Fix Does

The PR addresses each path independently:

**Route persistence** now writes the full `telegram::<chatId>:topic:<threadId>` address into `lastTo` for forum groups, so the topic survives restarts and reloads. This format was already handled correctly by the Telegram provider's `parseTelegramTarget`, so no provider changes were needed.

**Subagent announce routing** replaces the naive unconditional strip with `shouldStripThreadFromAnnounceEntry()`, a focused helper that compares the source and destination chat IDs. For same-chat Telegram forum routes, the topic is preserved. Cross-chat announces still have the `threadId` stripped, which is the safe behavior.

**Legacy cron delivery** — all four helpers are extended symmetrically to carry `threadId`, accepting both `string` and finite `number` values consistently.

**Session delivery reconstruction** — `extractDeliveryInfo()` now resolves `deliveryContext.threadId` via a three-level fallback: `deliveryContext.threadId` first, then `lastThreadId`, then `origin.threadId`. This covers the full range of how thread context might arrive at the delivery layer.

## Who Is Affected

Anyone using Telegram forum groups with OpenClaw who relies on async delivery patterns:

- **Cron job results** delivered to a specific forum topic will now land correctly
- **Subagent completions** announced back to the user will stay in the right thread
- **Session recovery** after a gateway restart will remember which topic the conversation belongs to

The fix is fully backwards compatible — if no `threadId` is present in any fallback source, behavior is identical to before.

## PR Confidence

Greptile reviewed the PR and gave it a 5/5 confidence score: "Safe to merge — no correctness issues found; all changes are additive and well-covered by tests." All four affected code paths have dedicated unit tests covering the happy path, the cross-chat strip case, and the legacy delivery variants.

The one architectural note raised was that `parseTelegramAnnounceTarget` in core now re-implements some of the same parsing logic as `parseTelegramTarget` in the Telegram extension. This is an acknowledged tradeoff — core cannot import from extensions — but the duplication has been flagged for future tracking to prevent drift.

## How to Update

This fix is on `main` and will ship in the next stable release. Watch [openclaw/openclaw releases](https://github.com/openclaw/openclaw/releases) for the tag. Once available, a standard `npm install -g openclaw@latest` will pick it up.

Forum group users who have been working around this by manually specifying delivery targets in cron jobs or subagent configs can clean up those workarounds once the next release lands.
