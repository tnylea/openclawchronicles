---
title: "OpenClaw Stops Duplicate Discord Retry Sends"
excerpt: "OpenClaw now uses Discord nonce enforcement so retried message creates can recover without posting duplicate text, media, polls, or approvals."
coverImage: '/assets/images/posts/openclaw-2026-7-11-discord-deduped-retries.png'
date: '2026-07-11T08:01:00.000Z'
dateFormatted: July 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-11-discord-deduped-retries.png'
---

OpenClaw's Discord channel picked up a high-priority delivery fix in [PR #103867](https://github.com/openclaw/openclaw/pull/103867), merged on July 11. The patch addresses a classic problem in agent messaging: a Discord message create can succeed on Discord's side while OpenClaw sees a transport failure and retries.

Before this change, that retry could become a second visible message. For human chat, duplicate sends are annoying. For an agent that can post approvals, media, voice-message fallbacks, polls, and workflow updates, duplicates can create real operator confusion.

## The Fix Uses Discord's Nonce Boundary

OpenClaw now gives each direct Discord Create Message request a stable 24-character random nonce and sends it with `enforce_nonce: true`. The important detail is where that nonce is built: once, before the retry runner starts.

That means all attempts for one logical message share the same Discord deduplication key. If the first request completed remotely and a later retry reaches Discord, the server can return the existing message instead of creating another one.

The PR says the coverage includes:

- Text messages.
- Media sends.
- Components.
- Stickers.
- Polls.
- Approvals.
- Voice messages.

That is the right surface area. Discord is not just a plain-text channel inside OpenClaw anymore; it is a delivery path for rich agent actions and operator handoffs.

## Retry Rules Stay Narrow

The change does not make every Discord failure blindly retryable. The nonce-protected classifier still treats pre-connect failures, rate limits, and HTTP 502 responses as retryable for Create Message.

Forum and media thread creation stay on a narrower pre-connect-only classifier. That distinction matters because Discord documents nonce enforcement for Create Message, not for every endpoint that can create a thread and a starter message together.

OpenClaw is preserving the line between safely replayable sends and operations that may have already committed in a less-deduplicated way.

## The Proof Is Practical

The PR includes both simulated and live Discord behavior proof. In the focused test path, sticker and poll sends were driven through the production send functions with a first POST returning HTTP 502 and a second POST returning success. Before the fix, the two attempts carried different nonces. After the fix, both attempts carried the same nonce.

The live Discord check then exercised the real `discord.com/api/v10` endpoint with `enforce_nonce: true`. Sending the same nonce twice returned the same message ID and delivered one message. Sending different nonces delivered two.

That is exactly the kind of evidence a message-delivery fix needs. It verifies not only OpenClaw's request construction but also Discord's server-side deduplication behavior.

## Why This Matters

OpenClaw agents often operate in high-noise channels where users care about whether a message was sent once, sent twice, or not sent at all. Retry behavior has to be boring and predictable.

This patch makes Discord delivery more honest under ambiguous transport failures. OpenClaw can keep recovering from transient failures without turning retry logic into duplicate chat output.
