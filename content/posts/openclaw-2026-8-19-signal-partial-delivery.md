---
title: "OpenClaw Signal Replies Keep Partial Delivery"
excerpt: "OpenClaw Signal replies now preserve durable receipts and reaction controls when a later chunk fails after visible delivery."
coverImage: '/assets/images/posts/openclaw-2026-8-19-signal-partial-delivery.png'
date: '2026-08-19T08:00:00.000Z'
dateFormatted: August 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-19-signal-partial-delivery.png'
---

OpenClaw merged a Signal delivery repair in [PR #126160](https://github.com/openclaw/openclaw/pull/126160), closing a sharp edge in how partial interactive and final replies behaved when a later send failed.

The issue was subtle because the user could already see part of the reply. Signal might send an early chunk successfully, then hit a later failure. Since ingress had already been durably adopted, OpenClaw would not replay the inbound event. But the accepted formatted content and approval or question reaction bindings could be lost, leaving the user staring at a visible prompt whose controls no longer worked.

That is the sort of bug that feels worse than a clean failure. A retry might duplicate content, but no retry can leave a conversation half-alive.

## What Changed

Signal final replies now use OpenClaw's shared durable-final delivery path. Non-final replies keep direct delivery, but accepted prefixes now run the same after-delivery bookkeeping used by the durable delivery system.

The PR says partial outcomes now project the canonical delivery receipt and accepted content. In practice, that means OpenClaw can distinguish between a proven no-dispatch failure and an ambiguous failure that happened after something was already sent.

The important boundaries are:

- Proven failures before the first send can retry.
- Ambiguous sends remain fail-closed.
- Accepted approval and question content keeps reaction bindings.
- Native quote behavior and fallback state are preserved.

That last point matters for Signal because the channel's UX depends heavily on native quoting and interaction affordances. The fix is not just "do not crash"; it is "preserve the controls that make the delivered message useful."

## Why It Matters

Channel delivery systems need to treat partial success as a real state, not as a temporary inconvenience. Once a user has seen a message, the system has crossed a product boundary. OpenClaw has to preserve proof of that delivery even if later chunks fail.

This PR tightens that boundary for Signal. It should reduce duplicate replay risk while keeping approval and question workflows usable after partial final delivery.

For operators running Signal-connected agents, the change should be most visible in long replies, interactive prompts, or unreliable transport moments where a delivery can fail after the first accepted chunk.

## Evidence From The PR

The PR reports a pre-fix regression where an approval binding became `null` after an early accepted chunk followed by a later send failure.

Validation included a 3/3 final-boundary test, the full Signal suite with 821 passing tests, 1,928 passing channel-contract tests, 236 shared durable/outbound tests, a passing build, `check-changed`, and a clean autoreview.

The author notes that no live Signal account was available, so verification used the real event-handler and SQLite boundary rather than a live account. That leaves a live-channel proof gap, but the tested boundary matches the failure mode described.
