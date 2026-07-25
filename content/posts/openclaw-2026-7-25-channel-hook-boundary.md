---
title: "OpenClaw Tightens Channel Hook Boundaries"
excerpt: "OpenClaw now runs outbound channel hooks on routed agent replies, closing a plugin rewrite and cancellation bypass across major chat channel delivery paths."
coverImage: '/assets/images/posts/openclaw-2026-7-25-channel-hook-boundary.png'
date: '2026-07-25T08:02:00.000Z'
dateFormatted: July 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-25-channel-hook-boundary.png'
---

OpenClaw merged [PR #113448](https://github.com/openclaw/openclaw/pull/113448), a P1 channel-delivery fix that makes outbound plugin hooks run consistently on normal routed agent replies.

The issue was subtle but important. OpenClaw channels can expose outbound hooks that let plugins rewrite, filter, or cancel messages before they become visible. The PR says normal agent replies routed through channel-specific delivery callbacks could bypass those rewrites or cancellations, making the documented `message_sending` boundary unreliable on a high-volume reply path.

For operators who use OpenClaw in Slack, Discord, Telegram, WhatsApp, or other routed channels, that boundary matters. It is where policy plugins, redaction tools, routing adapters, and organization-specific safety checks get their last chance to act before a message leaves the agent runtime.

## What Changed

The channel turn lifecycle now composes delivery in a fixed order for each routed payload:

- `reply_payload_sending`
- `message_sending`
- native channel delivery

That means normal routed replies pass through the same outbound control points developers expect, without running modifiers twice. The PR also makes Telegram and Discord hybrid preview/finalization paths declare their provider-owned boundary explicitly, while durable delivery remains on the shared queue path.

This is not a broad rewrite of every channel lifecycle edge. The PR explicitly leaves provider-finalized preview settlement and `message_sent` final-ID/content ownership outside this change, so the related issue remains open for later work.

## Why It Matters

OpenClaw's plugin system is only as trustworthy as the surfaces where plugins can reliably intervene. A plugin that rewrites secrets, cancels unsafe replies, or applies compliance language must see the reply before the native transport sends it.

Before this fix, the highest-volume routed delivery path had an inconsistency: a callback-based channel path could send a normal agent reply while skipping the expected outbound hooks. After the merge, plugin authors get a clearer contract for ordinary routed replies, and operators get a more predictable safety layer across custom delivery callbacks.

## Validation

The validation is unusually concrete for a channel-boundary fix. OpenClaw reports 294 focused assertions across turn lifecycle, auto-reply dispatch, Discord, Telegram, and WhatsApp surfaces.

The PR also includes live protocol proof. Telegram validation observed the exact sequence from `reply_payload_sending` through `message_sending`, native finalization, and `message_sent`, with each step firing once. Mattermost and Matrix proofs exercised production Gateway/plugin paths with real protocol ingress, rendered UI, and media-bearing automatic replies.

This is the kind of change that should be invisible when it works. Users still get routed replies in their channels, but the plugin boundary before those replies is now much harder to accidentally bypass.
