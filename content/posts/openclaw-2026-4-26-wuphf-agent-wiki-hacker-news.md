---
title: "WUPHF: The Karpathy-Style Agent Wiki That Hit 251 Points on Hacker News"
excerpt: "WUPHF is a self-hosted, OpenClaw-compatible wiki layer for AI agents using Markdown and Git as the source of truth, with BM25 search and entity fact logs."
coverImage: '/assets/images/posts/openclaw-2026-4-26-wuphf-agent-wiki-hacker-news.png'
date: '2026-04-26T23:10:00.000Z'
dateFormatted: April 26th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-26-wuphf-agent-wiki-hacker-news.png'
---

A new open-source project called **WUPHF** — a collaborative office and persistent wiki layer for AI agents — hit Hacker News yesterday and climbed to 251 points with 111 comments. Its core pitch: give AI agents like OpenClaw, Claude Code, Codex, and OpenCode a durable knowledge substrate built on Markdown and Git, without reaching for Postgres, pgvector, or a graph database.

The full [Show HN thread](https://news.ycombinator.com/item?id=47899844) and source code are at [github.com/nex-crm/wuphf](https://github.com/nex-crm/wuphf).

## The Problem It Solves

Most agent setups today lose context between sessions. Knowledge gets re-pasted every morning, or agents start cold without any accumulated understanding of the project or user. The typical solutions — vector databases, graph stores, structured datastores — add considerable infrastructure overhead.

WUPHF takes a different bet: how far can Markdown + Git go before you need anything heavier? The answer, based on their benchmark of 500 artifacts and 50 queries, is surprisingly far: **85% recall@20 on BM25 alone**, which is their internal ship gate. `sqlite-vec` is the pre-committed fallback if a query class drops below that threshold.

## How It Works

Each agent in WUPHF gets a private notebook at `agents/{slug}/notebook/*.md`, plus access to a shared team wiki at `team/`. The architecture is straightforward:

- **Draft-to-wiki promotion**: Notebook entries pass through a review step (agent or human) before landing in the canonical wiki with a back-link. A state machine drives expiry and auto-archive.
- **Entity fact logs**: Per-entity append-only JSONL files at `team/entities/{kind}-{slug}.facts.jsonl`. A synthesis worker rebuilds entity briefs every N facts. These commits land under a distinct "Pam the Archivist" git identity, so provenance is visible in `git log`.
- **[[Wikilinks]]** with broken-link detection rendered in red.
- **Daily lint cron** for contradictions, stale entries, and broken wikilinks.
- **`/lookup` slash command + MCP tool** for cited retrieval. A heuristic classifier routes short lookups to BM25 and narrative queries through a cited-answer loop.

## OpenClaw Integration

WUPHF is explicitly built to attach to existing agent setups. If you already have an OpenClaw deployment, you point WUPHF at it and the wiki layer attaches — you don't need to adopt the full "collaborative office" framework.

The install is a single command:

```bash
npx wuphf@latest
```

From there, the wiki lives at `~/.wuphf/wiki/` and can be `git clone`d out at any time. The creator describes this durability as intentional: "the wiki outlives the runtime, and a user can walk away with every byte."

## Why the HN Traction?

The 251-point response reflects genuine appetite for a simpler answer to agent memory. The thread surfaced healthy debate around the BM25-only recall bet versus vector search, the "Pam the Archivist" identity pattern as a provenance mechanism, and federation across multiple agent installations. The creator was active in responses, fielding questions about substrate tradeoffs and the promotion-flow state machine.

## Known Limits

WUPHF is honest about its current scope:

- **Recall tuning is ongoing** — 85% recall@20 on the benchmark is not a universal guarantee.
- **Synthesis quality is bounded by observation quality** — garbage facts in, garbage briefs out; the lint pass helps but it is not a judgment engine.
- **Single-office scope** — no cross-office federation yet.

The project is MIT-licensed, self-hosted, and bring-your-own-keys. Full source at [github.com/nex-crm/wuphf](https://github.com/nex-crm/wuphf).
