---
title: "Video: Microsoft Shows OpenClaw on Windows at Build 2026"
excerpt: "Microsoft Developer channel published a deep dive on running OpenClaw natively on Windows at Build 2026, covering the new Windows Hub and Scout agent integration."
coverImage: '/assets/images/posts/openclaw-2026-6-3-windows-build-2026-video.webp'
date: '2026-06-03T23:15:00.000Z'
dateFormatted: June 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-3-windows-build-2026-video.webp'
---

The official **Microsoft Developer** YouTube channel published a dedicated walkthrough of OpenClaw on Windows titled [**"OpenClaw + Windows: Microsoft Build 2026"**](https://www.youtube.com/watch?v=J7ol1VDkg7w) — the first official video from Microsoft covering the OpenClaw runtime directly.

The video is a companion to the broader Scout and Windows Hub announcements from Build 2026 earlier this week, where Microsoft revealed that Scout — its always-on personal agent for Microsoft 365 — is built on OpenClaw under the hood. The YouTube deep dive goes further into the Windows-specific story: how the [openclaw/openclaw-windows-node](https://github.com/openclaw/openclaw-windows-node) project brings native Windows node support, what the integration looks like in practice, and how developers can target the Windows runtime through the new Windows Hub.

## Why This Matters

Microsoft making a YouTube video about OpenClaw is not a small signal. The Scout announcement already confirmed that OpenClaw is embedded in a product shipping to hundreds of millions of Microsoft 365 users. A dedicated technical walkthrough from the Microsoft Developer channel means the Windows support story is real and intended for developer adoption — not just an internal integration buried in a product announcement.

For OpenClaw operators running on Windows (or planning to), the Windows Hub and native node project represent a supported path rather than the workaround territory that Windows has historically been for Linux-native tooling.

## What to Watch

The video covers:

- **Native Windows installation** via the Windows Hub — the OpenClaw team's Microsoft-adjacent repo for a first-class Windows node experience
- **Scout's OpenClaw foundation** — how the agent runtime maps onto the existing OpenClaw architecture (agents, skills, channels, gateway)
- **Developer onboarding** for building OpenClaw-compatible agents that target the Windows and Microsoft 365 ecosystem

If you caught the Scout announcement earlier this week and want to understand the technical substrate, this walkthrough is the clearest entry point available right now.

**Watch:** [OpenClaw + Windows: Microsoft Build 2026](https://www.youtube.com/watch?v=J7ol1VDkg7w) — Microsoft Developer on YouTube  
**Related:** [openclaw/openclaw-windows-node](https://github.com/openclaw/openclaw-windows-node) on GitHub
