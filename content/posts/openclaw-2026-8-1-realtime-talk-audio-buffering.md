---
title: "OpenClaw Tightens Realtime Talk Audio Startup"
excerpt: "OpenClaw PRs #117604 and #117640 preserve early realtime Talk audio while bounding startup and reconnect buffers."
coverImage: '/assets/images/posts/openclaw-2026-8-1-realtime-talk-audio-buffering.png'
date: '2026-08-01T23:02:00.000Z'
dateFormatted: August 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-1-realtime-talk-audio-buffering.png'
---

Two OpenClaw realtime Talk fixes landed tonight, both focused on the same user-facing promise: when someone starts speaking during session startup, the system should not silently drop or reorder their opening audio.

[PR #117604, "fix(openai): retain Gateway microphone frames during peer startup"](https://github.com/openclaw/openclaw/pull/117604) repairs the OpenAI GPT-Live WebRTC media path. [PR #117640, "fix(google): keep realtime startup audio bounded and ordered"](https://github.com/openclaw/openclaw/pull/117640) applies the same kind of discipline to Google realtime voice startup and reconnects.

Together, they show OpenClaw tightening one of the trickier parts of realtime agent UX: the gap between "the session exists" and "the provider media pipe is fully ready."

## What Changed

The OpenAI-side fix addresses Gateway relay Talk sessions that can return a usable session identifier before the GPT-Live WebRTC media peer is created. Browser capture may begin immediately, and before this patch the Gateway could report microphone frames as accepted even though the bridge discarded them while waiting for the peer.

OpenClaw now owns that pre-peer adoption gap with a bounded PCM16 queue. It retains at most the newest five seconds, capped at 240,000 bytes, copies caller-owned input before capture transports can recycle it, discards incomplete trailing PCM16 bytes, flushes the retained tail once when the peer is adopted, and clears queued audio on close, cancellation, or failed startup.

The Google fix handles a neighboring problem. During Google realtime voice startup or reconnect, early audio could be retained without a byte bound, reordered between the lazy loader and native provider, or accepted after a terminal close.

That path now uses a plugin-local bounded audio queue with separate policies for its two existing owners. Lazy startup preserves the newest microphone tail, while the native provider preserves the already accepted FIFO prefix. The retained data is copied, capped at 320 chunks and 1 MiB, transferred before connection, and shut off after terminal close until an explicit reconnect.

## Why It Matters

Realtime voice systems are judged harshly on the first second. If a user says "hey, summarize this" while the transport is still warming, the first word or phrase matters. Losing it makes the assistant feel unreliable even if the rest of the session works.

The fixes are also careful about memory and lifecycle boundaries. OpenClaw is not simply buffering everything until a provider is ready. It is using bounded queues with explicit overflow behavior, and it clears pending audio when the session is no longer valid.

That balance matters for always-on or reconnect-heavy setups. Operators get better startup behavior without unbounded microphone retention, hidden protocol changes, new configuration, or extra public SDK surface.

## Evidence

Both PRs include targeted regression coverage. The OpenAI patch documents the intended queue rules around newest-tail retention, byte caps, copied input, single flush on peer adoption, and cleanup on failure. The Google patch covers ordered transfer, chunk and byte limits, overflow handling, and late-audio rejection after terminal shutdown.

For OpenClaw users testing realtime Talk on the 2026.7.2 line, the practical takeaway is clear: early speech during OpenAI and Google realtime startup should be retained in order, within explicit memory bounds, instead of being silently lost.
