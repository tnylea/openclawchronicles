---
title: "Carapace Gives OpenClaw Eyes: A New Vision and Sensor Layer"
excerpt: "Carapace layers live camera vision, voice, GPS context, and brain-inspired memory onto any OpenClaw instance, with a free iPhone companion app and ten-minute setup."
coverImage: '/assets/images/posts/openclaw-2026-5-5-carapace-vision-layer.png'
date: '2026-05-05T23:10:00.000Z'
dateFormatted: May 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-5-carapace-vision-layer.png'
---

A new ecosystem project called [Carapace](https://carapace.info) launched this week with a straightforward pitch: OpenClaw can already think, search the web, run code, and manage files — but it cannot see what you see. Carapace fixes that.

The project surfaced on Hacker News this morning ([story 48019383](https://news.ycombinator.com/item?id=48019383)) under the tagline "Your OpenClaw Can See," and the site has enough detail to understand exactly what it is and is not.

## What Carapace Adds

Carapace is a sensory layer that wraps around an existing OpenClaw install. It does not replace OpenClaw's reasoning; it feeds it richer input. The senses on offer:

- **Vision Mode** — Point your iPhone camera at anything (a plant, a wine label, a dishwasher error code, a mushroom) and ask. The agent answers with sources.
- **Deep Scan** — A 60-second context capture that stitches a panned scene into one rich query. Walk an aisle or sweep a room; the agent sees the whole thing.
- **Sticker-Peel Focus** — Pinch-zoom to isolate a specific object from a cluttered background before sending it to the model.
- **Voice Mode** — Natural back-and-forth with sub-second first-audio latency. Apple Speech transcription runs on-device.
- **Place and Motion** — The app knows you are at the hardware store before you say so, and knows you are walking versus driving. Context the agent gets for free.
- **On-Device OCR** — Apple Vision reads every word in frame before anything leaves the phone. Receipts, prescriptions, signage — text-first, image only if the agent needs it.

## The Memory Architecture

The memory story is more ambitious than most AI apps. Carapace describes a layered cognitive model loosely inspired by neuroscience:

- **Hippocampus** — Episodic memory of specific moments, retrieved by time, place, or topic
- **Place Cells and Grid Cells** — Learns the shape of rooms, blocks, and routes you visit; distinguishes "your kitchen" from "a kitchen"
- **Default Mode Network** — Consolidates raw experience into stable schemas in the background between turns, similar to how sleep works for humans

Whether the neuroscience framing translates cleanly into a production system is a fair question, but the underlying claim — that the memory model is richer than a flat vector database of past chats — is plausible and interesting.

## Pricing and Install

The install story is two commands on Linux or VPS:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
curl -fsSL https://carapace.info/install.sh | bash
```

The Mac app is a notarized DMG. The project claims non-destructive installation on existing OpenClaw setups — chats, keys, and identity files are preserved.

Pricing is structured around the number of OpenClaw gateways a single iPhone can pair with:

- **Solo** — Free forever, iPhone pairs with 1 gateway. Mac and Linux always unlimited.
- **Power** — $7.99 one-time in-app purchase, up to 10 gateways. Meta Ray-Ban beta for first 500.
- **Corporate** — $24.99 one-time, up to 50 gateways.

No subscription. You bring your own AI keys (Gemini, ChatGPT, Claude, Grok). Carapace itself does not see your data — it routes through your own hardware via Tailscale.

## The Dashboard Features

Beyond vision and voice, Carapace ships a surprisingly full-featured agent control panel:

- **Project Board** — Live agent project tracking with per-workstream status and blockers
- **Spinal Map** — Real-time view of running agents and subagents
- **Cron Tracker** — Scheduled job health with RED/YELLOW/GREEN status and next-run ETAs

These overlap with OpenClaw's own Control UI dashboard, though the mobile-native UX and the integration with camera and location make Carapace a genuinely different surface for managing agents on the go.

## Who This Is For

Carapace is not trying to compete with OpenClaw — it explicitly positions itself as additive. The install guide even starts with an `openclaw.ai/install.sh` step. The most obvious use cases are people who want their OpenClaw agent to work with the physical world: price-checking thrift finds, co-piloting home repairs with live camera guidance, or filing receipts on the fly.

The Meta Ray-Ban integration (in beta, later this year) is the most forward-looking piece — hands-free vision with the same OpenClaw backend would be a genuinely novel experience.

More at [carapace.info](https://carapace.info).
