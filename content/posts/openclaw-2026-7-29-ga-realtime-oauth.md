---
title: "OpenClaw Brings GA Realtime To ChatGPT OAuth"
excerpt: "OpenClaw browser Talk now supports GA OpenAI Realtime models through a Gateway-brokered ChatGPT OAuth fallback."
coverImage: '/assets/images/posts/openclaw-2026-7-29-ga-realtime-oauth.png'
date: '2026-07-29T08:02:00.000Z'
dateFormatted: July 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-29-ga-realtime-oauth.png'
---

OpenClaw browser Talk gained a useful model-access upgrade on Wednesday: GA OpenAI Realtime models can now work through ChatGPT OAuth when no Platform API key is configured. [PR #115623](https://github.com/openclaw/openclaw/pull/115623), titled `feat(openai): support GA realtime over ChatGPT OAuth`, merged at 06:14 UTC.

Before this change, browser Talk could already use ChatGPT OAuth for GPT-Live, but GA OpenAI Realtime models still required a Platform API key. That left OAuth-only OpenClaw installations with a split experience: one realtime path worked through the subscription credential, while the GA Realtime path did not.

## What Changed

The PR extends OpenClaw's existing OpenAI single-use offer broker instead of adding a separate route. GPT-Live keeps its multipart `/v1/live` call and Gateway sideband. GA Realtime models use raw `application/sdp` at `/v1/realtime/calls?model=<model>` and keep the browser-owned data channel and tool loop.

The supported browser Talk models called out in the PR are:

- `gpt-realtime-2.1`
- `gpt-realtime-2.1-mini`
- `gpt-realtime-2`

Platform authentication still takes precedence for GA Realtime. ChatGPT OAuth is a browser-only fallback when no Platform source is configured. The PR also keeps iOS, Voice Call, Gateway relay, provider WebSocket, Discord, and Android realtime on Platform keys only.

## The Security Boundary

The key design point is that OAuth material remains on the Gateway. The browser receives only the existing short-lived broker token and answer SDP. That preserves the same general shape as the previous brokered realtime flow while extending it to GA Realtime calls.

That distinction matters for personal OpenClaw installs. Many users have a ChatGPT subscription connected before they have a separate Platform billing setup. Letting browser Talk use that existing credential lowers friction, but the credential boundary still has to stay server-side.

## Why It Matters

Realtime voice and browser Talk are becoming a more important part of OpenClaw's day-to-day interface. Users increasingly expect to switch between typed chat, voice, and live browser interaction without stopping to reconfigure provider credentials.

This merge makes that path smoother for ChatGPT OAuth-only installations. If a user has no Platform API source configured, browser Talk can still create GA Realtime WebRTC calls through the Gateway-brokered fallback.

The proof is also concrete. The PR reports 199 passing tests across OpenAI realtime provider, wire, session, delegation, and Gateway Talk test files. It also cites a live test where real Chromium offers for all three GA models received `201` answer SDP through the broker and applied it as the remote description, with no token material logged.

For operators, the practical takeaway is that OpenClaw's browser Talk surface is becoming less dependent on a separate Platform key while keeping Platform auth preferred wherever it exists.
