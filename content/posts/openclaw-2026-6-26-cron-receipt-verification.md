---
title: "OpenClaw Cron Receipts Stop False Delivered States"
excerpt: "OpenClaw now rejects empty outbound channel receipts so cron jobs no longer report delivered messages without a real platform identity."
coverImage: '/assets/images/posts/openclaw-2026-6-26-cron-receipt-verification.png'
date: '2026-06-26T08:01:00.000Z'
dateFormatted: June 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-26-cron-receipt-verification.png'
---

OpenClaw merged [PR #79811, "fix(cron): avoid delivered status for empty outbound receipts"](https://github.com/openclaw/openclaw/pull/79811), a P1 reliability fix for scheduled automation that sends messages through channel adapters.

The issue was a mismatch between "the adapter returned" and "the platform actually accepted a message." A cron announce or direct-delivery path could treat an outbound adapter result as successful even when the result did not contain a usable delivery identity. In that case, a run could show `delivered: true` even though OpenClaw had no real platform `messageId`, `chatId`, `channelId`, `roomId`, `conversationId`, `toJid`, or `pollId` to prove that anything landed.

For operators, that is worse than a visible failure. A false delivered state can make a scheduled job look healthy while the target channel never saw the message.

## What Changed

The shared outbound delivery result handling now requires a real delivery identity before a send is counted as successful. Empty or identity-less results flow through the existing suppressed path instead of becoming a sent result.

In practical terms, cron delivery can now distinguish between:

- A real channel send with a platform identity.
- A delivery attempt that produced no visible platform receipt.
- A suppressed or no-visible-result outcome that should not be reported as delivered.

The PR body says the fix maps empty identity results to `delivered: false` while preserving `deliveryAttempted: true`. That pairing is useful because it tells operators the job did try to send, but the channel adapter did not produce proof of delivery.

## Why It Matters

Cron jobs are often used for unattended work: reports, monitoring, summaries, reminders, and channel notifications. Those workflows need honest delivery state more than optimistic delivery state.

If a scheduled job cannot prove it delivered a message, the correct operational signal is not success. It should be visible as an undelivered or suppressed result so the operator can investigate the adapter, channel credentials, or platform response.

This also helps downstream automation. A dashboard, alert rule, or follow-up cron can make better decisions when `delivered` reflects an actual platform identity instead of a best-effort adapter return.

## Validation

The PR includes `P1`, `proof: supplied`, `proof: sufficient`, and `merge-risk: message-delivery` labels. Its proof registered a Telegram outbound adapter that returned an empty `messageId`, then called OpenClaw's durable message batch path. The patched runtime returned a suppressed result with `reason: "adapter_returned_no_identity"` and no platform message IDs.

That is the right failure mode. OpenClaw still records that delivery was attempted, but it no longer claims the channel delivered something it cannot identify.
