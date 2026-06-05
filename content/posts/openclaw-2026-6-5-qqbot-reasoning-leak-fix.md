---
title: "OpenClaw Patches Reasoning Leak and WhatsApp Hang in Channel Fixes"
excerpt: "Two fixes merged June 5 close a reasoning-block leak in QQBot delivery and prevent WhatsApp from hanging forever on connection startup."
coverImage: '/assets/images/posts/openclaw-2026-6-5-qqbot-reasoning-leak-fix.png'
date: '2026-06-05T08:00:00.000Z'
dateFormatted: June 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-5-qqbot-reasoning-leak-fix.png'
---

Two small but meaningful fixes landed on `main` on June 5, 2026, closing a privacy gap in QQBot delivery and patching an indefinite hang in WhatsApp connection startup. Neither made it into the v2026.6.2-beta.1 changelog, but both are headed for the next release.

## QQBot Was Exposing Internal Reasoning to Users

With reasoning models now mainstream inside OpenClaw — Anthropic extended thinking, MiniMax M3 (added in v2026.6.2), and others — agents routinely produce internal `<thinking>` or `<think>` content blocks before settling on a final answer. That private chain-of-thought is intentional; what isn't intentional is users seeing it.

OpenClaw's shared outbound delivery layer is designed to strip that scaffolding before it reaches a channel's users. It does so by calling a channel's `sanitizeText` hook, which runs the internal `sanitizeAssistantVisibleText` pipeline — filtering out reasoning tags, tool-call scaffolding, and other behind-the-scenes markers.

The problem: QQBot, Tencent's messaging platform used across China, didn't have that hook wired up. The omission meant raw `<thinking>` blocks could flow through to end users verbatim — exposing the model's full internal reasoning in the chat window.

[Pull request #90132](https://github.com/openclaw/openclaw/pull/90132), authored by `openperf` and merged June 5, adds the `sanitizeText` hook directly to the QQBot channel plugin. The implementation is narrow on purpose: it applies only at the QQBot outbound boundary and leaves QQBot's native media-tag processing (for the image, video, and markdown tags specific to Tencent's protocol) completely untouched. A regression test covering both stripping behavior and ordinary-text preservation ships alongside the fix.

## Why QQBot Users Are Exposed More Than Others

QQBot sits at the edge of OpenClaw's most active non-Western deployment footprint. Operators running QQBot-connected instances often pair it with Chinese-native models — particularly MiniMax — which expose reasoning content by default in their latest generations. The v2026.6.2 release added MiniMax M3 support, making this gap more urgent: new reasoning model, same missing sanitization.

For operators on any reasoning-capable model routed through QQBot, the upgrade path is simple: update to the next release when it ships. If you are building directly from `main`, the fix is live now.

## WhatsApp Monitor Could Hang Forever on Startup

The second fix targets a different but equally frustrating issue: WhatsApp connections sometimes refused to report their status.

OpenClaw's WhatsApp plugin uses the Baileys library to manage the connection lifecycle. When the monitor loop starts, it calls `waitForWaConnection` and waits for a `connection.update` event signaling either `open` or `close`. Under normal conditions this completes in a few seconds. Under abnormal conditions — network blips, internal Baileys errors, transient cloud routing failures — the event never fires, and `waitForWaConnection` returns a promise that hangs indefinitely.

The effect in practice: the entire WhatsApp monitor loop stalls, and the channel stops processing messages until the Gateway is restarted.

[Pull request #90486](https://github.com/openclaw/openclaw/pull/90486), authored by `mcaxtr`, adds a configurable timeout parameter (defaulting to `0`, which preserves the original wait-forever behavior for backward compatibility). At the monitor callsite — the one path where indefinite hanging is actually a problem — the fix passes a 60-second timeout explicitly. If no connection state arrives within 60 seconds, the promise rejects with a descriptive error, the event listener is cleaned up, and the monitor can recover gracefully.

The QR code login flow is not affected: it calls `waitForWaConnection` without a timeout and continues to wait the full three minutes a user might need to scan.

## What This Means for the 2026.6.x Beta Train

Both fixes are on `main` and will roll into the next release. The v2026.6.2-beta.1 release (available on [npm](https://www.npmjs.com/package/openclaw/v/2026.6.2-beta.1)) does not include either fix, but the release train is still active.

Operators running QQBot with reasoning models or seeing periodic WhatsApp connection stalls are the direct audience. For everyone else, these are the kinds of incremental reliability and privacy improvements that keep channels from surprising you at the worst moment.

Track the [GitHub releases page](https://github.com/openclaw/openclaw/releases) for the next beta or stable tag.
