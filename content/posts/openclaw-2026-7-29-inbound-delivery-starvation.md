---
title: "OpenClaw Fixes Inbound Delivery Starvation"
excerpt: "OpenClaw now bounds inbound message debounce batches so active Telegram and channel conversations keep making ordered progress."
coverImage: '/assets/images/posts/openclaw-2026-7-29-inbound-delivery-starvation.png'
date: '2026-07-29T08:01:00.000Z'
dateFormatted: July 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-29-inbound-delivery-starvation.png'
---

OpenClaw merged a delivery reliability fix on Wednesday that prevents active inbound conversations from starving agent turns. [PR #115682](https://github.com/openclaw/openclaw/pull/115682), titled `fix: prevent sustained inbound messages from starving delivery`, landed at 07:44 UTC and closes issue #104106.

The bug affected users who sent messages continuously faster than the configured inbound debounce window. Instead of producing an agent turn, the pending same-conversation batch could keep growing until the messages finally stopped. For a busy Telegram conversation, that meant OpenClaw could accept incoming updates yet never advance to the response stage.

## What Changed

OpenClaw keeps the existing trailing-edge debounce behavior, but now bounds each batch to five times its first configured quiet window. The deadline is monotonic, so later per-message overrides and wall-clock corrections cannot keep pushing delivery out forever.

The PR is careful about compatibility. It does not add new configuration, channel-specific heuristics, dropped messages, or transport contract changes. It also keeps the existing same-key ordering, ingress adoption, cancellation, shutdown behavior, and disabled-by-default behavior.

That is a good shape for a channel reliability fix. Users should not have to learn a new setting to avoid starvation, and channel integrations should not need special-case logic just because one conversation is unusually active.

## Telegram First, Channels Next

The clearest reported impact is on Telegram, where inbound updates often arrive in bursts. The proof reproduced 24 forwarded updates arriving every 20 milliseconds through the SQLite spool, ingress drain, grammY, and an 80 millisecond forward lane. On current main, the test produced zero downstream turns. After the fix, the batch dispatched while updates were still arriving, every message delivered once and in order, and all 24 durable entries tombstoned.

The same logic benefits other enabled channel conversations because the fix lives in the shared inbound debounce path. The PR reports sibling ingress proof across WhatsApp, Mattermost, Feishu, Microsoft Teams, and shared channel policy tests.

## Why Operators Should Care

Message delivery bugs are often worse than obvious crashes. If a channel drops a clear error, users can retry or escalate. If OpenClaw accepts messages and quietly fails to produce a turn, the system looks alive while the conversation is effectively stuck.

This fix targets that silent failure mode. Sustained conversations now make forward progress in complete, ordered batches. Normal bursts, immediate commands, media handling, and durable ingress behavior are unchanged.

The validation set is focused and practical. The PR cites deterministic fake-clock regressions for indefinite same-key starvation, deadline extension through later overrides, and a 60-second backward system-clock correction. It also reports 196 relevant tests across inbound, Telegram E2E, WhatsApp, Mattermost, Feishu, Microsoft Teams, and shared channel policy.

For users, the visible result should be boring in the best way: keep talking, and OpenClaw should keep responding.
