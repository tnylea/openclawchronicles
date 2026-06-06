---
title: "Omni Brings On-Device Semantic Search to OpenClaw Agents"
excerpt: "Omni indexes every file on your Mac into a single vector space and serves it to OpenClaw agents via a private loopback endpoint—no cloud required."
coverImage: '/assets/images/posts/openclaw-2026-6-6-omni-local-search.png'
date: '2026-06-06T23:00:00.000Z'
dateFormatted: June 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-6-omni-local-search.png'
---

OpenClaw agents are already capable of browsing the web, writing code, and managing calendars — but searching the files sitting on your own machine has always required either a cloud service or a clunky workaround. **Omni**, a new native macOS app from independent developer Han Xiao, changes that by exposing a local, token-guarded HTTP endpoint that OpenClaw (and Hermes) can query directly, returning semantically relevant results from your entire file system without a single byte leaving your device.

## What Omni Actually Does

Omni isn't a traditional keyword search. It runs a Swift-native port of **jina-embeddings-v5-omni** on Apple Silicon's GPU (via MLX-Swift), embedding everything — text files, code, PDFs, scanned documents, images, audio, and video — into a single shared vector space. That means a plain-language query like "the invoice from March" can surface a scanned PDF, an audio voicemail, and a screenshot of an email all in one ranked result set.

The model downloads once and then runs fully offline. There are no accounts, no telemetry, and no network calls at query time. The local SQLite vector store lives on your machine. This is the kind of privacy story that makes OpenClaw's self-hosted philosophy click: your agent can reason over your documents without any of that context leaving the machine.

## The OpenClaw Integration

The integration point is straightforward. Omni exposes a loopback-only HTTP endpoint (bound to `127.0.0.1`) with token-based authentication. Once you add your endpoint credentials to OpenClaw as a skill or tool — the same way you'd wire up any local HTTP service — your agent can issue natural-language queries and receive ranked file results to act on.

The author described the intended use case clearly in the [Show HN thread](https://news.ycombinator.com/item?id=48419626):

> "HTTP server exposes search to local agents like OpenClaw & Hermes — search is near-instant. Multimodal relevance is sometimes arguable, but the idea is recall (the agentic LLM takes the results and refines for the final answer), so maybe that's fine."

That framing is exactly right. Omni handles the recall layer — surfacing a broad set of semantically plausible candidates — while the OpenClaw agent handles the reasoning layer, filtering and synthesizing from what Omni returns. Neither component needs to be perfect in isolation.

## Hardware and Practical Notes

Omni requires **macOS 14+ on Apple Silicon** (M-series chip). The developer tested it on M3 Pro 18 GB, M3 Ultra 512 GB, and M4 Pro 48 GB. Search is described as near-instant across all three. Indexing throughput varies by file type: 10K tokens/second for some formats, down to 300 tps for others — so expect initial indexing of a large library to take some time. The fans will run hard during that pass.

Beyond the core search endpoint, Omni also exposes a raw embeddings API compatible with the OpenAI, Jina, Cohere, and Gemini embedding formats — useful if you want to plug Omni's vectors into other pipelines or retrieval stacks.

Current version at time of writing: **v0.1.19**.

## Why This Matters for OpenClaw

The pattern Omni establishes — a locally-hosted, agent-accessible API for device-native data — is one that's going to keep coming up as OpenClaw's ecosystem matures. Tools like Carapace (camera, voice, GPS), Omni (file search), and the formative-memory plugin are all pushing in the same direction: give OpenClaw agents high-quality sensory access to the real world and the real machine, without routing that data through third-party servers.

For users running OpenClaw on a Mac mini or MacBook as a personal assistant, Omni is a practical addition right now. Set it to index your `~/Documents`, `~/Downloads`, and a `~/Projects` folder, wire the endpoint into OpenClaw, and your agent gains meaningful recall over your local knowledge base — meeting notes, saved research, old invoices, whatever you've accumulated.

The app is free to download at [hanxiao.io/omni](https://hanxiao.io/omni/).
