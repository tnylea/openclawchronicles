---
title: "OpenClaw Telegram Queues Recover From Poison Messages"
excerpt: "OpenClaw fixed Telegram spool retries so poison updates back off, dead-letter, and stop blocking later chat messages."
coverImage: '/assets/images/posts/openclaw-2026-7-1-telegram-poison-message-recovery.png'
date: '2026-07-01T23:05:00.000Z'
dateFormatted: July 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-1-telegram-poison-message-recovery.png'
---

OpenClaw merged a late July 1st Telegram reliability cluster, led by [PR #98776](https://github.com/openclaw/openclaw/pull/98776) and [PR #98775](https://github.com/openclaw/openclaw/pull/98775), that tightens how the Telegram channel handles failed polling, spooled updates, duplicate delivery, and stuck queue lanes.

The user-facing result is straightforward: a single bad Telegram update should no longer freeze an entire chat or topic.

## What Broke

PR #98776 describes a spool failure mode where one Telegram update could keep retrying every roughly 500ms forever. Because the spool drain claims the lowest update ID per conversation lane, that poison row could permanently block later messages in the same chat or topic.

The same PR also fixes two related defects:

- A transient store read error during restart replay could silently delete a spooled message
- Successfully processed rows were deleted instead of tombstoned, so crash-window refetches could re-dispatch already processed updates

That last case is especially important for callback queries and buttons. A duplicate delivery is not just noisy; it can repeat a side effect.

## The Recovery Model

PR #98776 generalizes Telegram spool backoff across retryable failures. Failed spooled updates now back off exponentially from persisted queue state, starting at a one-second base and capping at three minutes.

After eight attempts, the stuck row dead-letters to the existing failed tombstones. That means the lane can move forward instead of being held hostage by one malformed or persistently failing update.

The success path now uses completed tombstones with retention, so enqueue-time duplicate detection can absorb refetched updates after a crash window. The PR also fixes redrain ordering so lane guards clear before immediate redrain is requested.

## Polling Gets Safer Too

The sibling [PR #98775](https://github.com/openclaw/openclaw/pull/98775) addresses Telegram polling itself. It fixes transient `getUpdates` failures, including rate limits and server errors, so they do not crash the account polling session and eventually disable the channel through repeated supervisor restarts.

That PR also stops per-send cache rewrites on the hot path, reducing the amount of state churn around Telegram delivery.

Taken together, the two PRs improve both ends of the same channel path: receiving updates from Telegram and replaying them durably through OpenClaw.

## Why Operators Should Care

Telegram is often used as a primary control surface for OpenClaw. It is where users send commands, steer active runs, approve actions, and receive results.

When a channel lane freezes, the symptom is ugly: later messages appear to vanish, command recovery gets delayed, and operators may restart the Gateway without knowing which update caused the jam.

The new behavior gives the system a better failure shape. Retryable failures back off. Persistent failures dead-letter. Later messages can proceed. Duplicate refetches are filtered instead of replayed.

## Validation

The PRs report focused regression coverage for dead-lettering after max attempts, transient pairing-store replay errors, completed-then-refetched duplicate detection, polling session behavior, and combined merge validation across sibling Telegram fixes.

The important proof is not just that the channel survives one happy path. It is that Telegram can now handle poison updates, transient API failures, restart windows, and duplicate refetches without turning one failed row into a stuck conversation.

## Bottom Line

OpenClaw's Telegram channel is getting a more durable queue discipline.

For anyone running OpenClaw through Telegram, this is the kind of boring infrastructure fix that matters: failed messages are contained, later messages keep moving, and restart windows should be less likely to lose or repeat work.
