---
title: "OpenClaw Cron Deliveries Now Keep Reply Context"
excerpt: "OpenClaw cron deliveries now preserve next-turn channel context, helping scheduled messages stay understandable without exposing cron metadata."
coverImage: '/assets/images/posts/openclaw-2026-6-20-cron-reply-context.png'
date: '2026-06-20T23:00:00.000Z'
dateFormatted: June 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-20-cron-reply-context.png'
---

OpenClaw's scheduled-message story got a practical reliability fix tonight with [PR #93580](https://github.com/openclaw/openclaw/pull/93580), a merged change that preserves target-session awareness after cron deliveries reach a channel.

The short version: if a cron job sends a message into Telegram, Weixin, or another channel, the next agent turn in that same channel can now understand what was just delivered. That matters for reminders, reports, monitoring alerts, scheduled research digests, and any workflow where a human replies to a pushed message and expects the agent to keep up.

## What Changed

The PR focuses on isolated cron deliveries where the visible message was reaching the channel, but the receiving session did not always get the hidden context needed for the next turn. The delivered message stayed visible to the human, but the agent could still answer as if nothing had happened.

The new behavior queues an ephemeral system-event awareness entry for the target session after a delivery path succeeds. That awareness includes the delivered content, or delivery-failure context when the run reaches a target-aware failure branch.

The user-facing message itself does not grow extra metadata. The PR explicitly keeps cron job ids, scheduling metadata, and transport internals out of the channel payload.

## Why It Matters

Cron is one of OpenClaw's biggest differences from normal chat agents. It lets an assistant act on a schedule, not just when someone sends a prompt. But scheduled work becomes brittle if the agent cannot connect a follow-up message to the delivery that prompted it.

This fix closes that gap for a few important paths:

- Direct or automatic cron delivery.
- Verified message-tool delivery.
- Explicit message-tool sends that visibly delivered to a channel.
- Threaded message-tool delivery with implicit thread evidence.
- Media-only message-tool delivery, using the existing transcript mirror filename projection.
- Target-aware delivery failures.

That is a lot of surface area, and the PR's risk checklist calls out session targeting as the highest-risk area. The mitigation is also clear: reuse existing outbound session route resolution, transcript mirror projection, and idempotency keys instead of inventing a parallel routing system.

## Proof From Real Channels

The PR includes live proof from Weixin and Telegram. In the before case, the published `openclaw@2026.6.8` build delivered a Telegram cron message successfully, but the next Telegram turn did not know what had just been delivered.

After the fix, the maintainer-tested PR build delivered the cron or message-tool content, and the next Telegram turn could answer with the exact delivered code.

The tests are also targeted at the bug class rather than only the happy path. The author reports 77 passing tests for `delivery-dispatch.double-announce.test.ts`, 52 passing tests for `run.message-tool-policy.test.ts`, a passing build, and clean local review runs.

## The Bigger Cron Direction

OpenClaw has been steadily moving scheduled work from "fire and forget" toward contextual automation. Recent cron work covered direct transcript mirrors, explicit delivery target proof, and now target-channel next-turn awareness.

This change is not flashy, but it is the kind of fix that makes scheduled agents feel less like scripts and more like participants in the same channel. The important bit is restraint: OpenClaw gets the context it needs, while the human still sees only the message they were meant to receive.
