---
title: "OpenClaw Plugin Gives Agents Memory That Strengthens with Use"
excerpt: "formative-memory is a new OpenClaw plugin built by Jari Mustonen that brings biologically-inspired memory to agents — recalling, forgetting, and consolidating overnight."
coverImage: '/assets/images/posts/openclaw-formative-memory-plugin.webp'
date: '2026-05-07T23:00:00.000Z'
dateFormatted: May 7th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-formative-memory-plugin.webp'
---

Jari Mustonen, a developer with a background in personality psychology, posted a new OpenClaw plugin to Hacker News this morning. [formative-memory](https://github.com/jarimustonen/formative-memory) replaces OpenClaw's built-in memory systems with something designed around how biological memory actually works: memories strengthen through use, fade when ignored, and consolidate overnight into richer structures.

The plugin is v0.5.5, MIT-licensed, and installable in one command:

```bash
openclaw plugins install formative-memory
```

## The Core Idea

Standard memory plugins store and retrieve. formative-memory adds a feedback loop: every time a memory is recalled and the agent actually leans on it in a reply, that memory gets stronger. Memories that are surfaced but never referenced don't get reinforced and gradually fade. The result, over time, is a memory system that learns what's useful — not just what matches a query.

Mustonen's background in personality psychology shapes the design philosophy. His hypothesis: if you let an agent accumulate memories that strengthen through use, you get something that starts to look like consistent personality — preferences, associations, and a sense of continuity that persists across sessions.

## How Recall Works

Before every response, the plugin runs hybrid search against stored memories: embedding similarity plus BM25 full-text, ranked by memory strength. It also expands one hop along strong association edges, so related memories surface even when they don't directly match the query.

Here's the example from the README:

> User: "Do you remember that restaurant? The one by the beach last summer. I'm trying to book for our anniversary."

Injected context:
```
[a3f2|fact|strength=0.82] "Dinner at Maininki, Hanko, April 2026"
[b7d1|event|2026-07-04] "Wedding anniversary — 12 years"
[c9f3|preference|str=0.74] "Sanna loves peonies"
[d2e6|fact|2026-07-02] "Sanna: private doctor's appointment"
```

The agent sees recalled memories as context, not instructions — reducing prompt injection risk from stored content.

## The Nightly Consolidation

This is where formative-memory earns its name. Every night, the agent "sleeps." The consolidation process runs through accumulated memories in order:

1. **Reinforce** — memories that influenced responses gain strength
2. **Decay** — all strengths decrease; recent memories fade faster than established ones
3. **Associate** — memories retrieved together form weighted bidirectional links
4. **Temporal shift** — future-dated memories transition to present or past
5. **Prune** — weak memories and associations are removed
6. **Merge** — similar memories are combined into coherent summaries via LLM

The README shows this beautifully: three separate memories about a restaurant in Hanko merge into a single, richer memory — "Maininki, Hanko: beachfront restaurant with good wine list. Visited April 2026. Book early — fills up in summer." — with association edges to "Wedding anniversary" and "Sanna loves peonies."

## Attribution Tracking

After each response, the plugin tracks which memories were surfaced and which were actually referenced in the reply. Frequently used, highly-rated memories are reinforced during nightly consolidation. Memories that are injected but never referenced don't gain strength. This is separate from explicit feedback (the agent can call `memory_feedback` with a 1-5 rating), which is also fed into consolidation.

## Storage and Privacy

The database is SQLite with FTS5 — a single file at `~/.openclaw/memory/associative`, no external services. What leaves the machine: conversation text for auto-capture extraction, embeddings (to OpenAI or Gemini, your choice), and candidate memory pairs for nightly merging (via Claude or OpenAI).

You can opt out of auto-capture and use explicit `memory_store` calls only, or disable embeddings entirely and run in BM25-only mode. The trade-off on BM25-only is that paraphrase matching breaks — searching "shipping date" won't surface a memory about "release deadline."

## Coexistence with Built-in Memory

The plugin recommends disabling OpenClaw's built-in memory features to avoid redundancy:

```json
{
  "plugins": {
    "entries": {
      "active-memory": { "enabled": false },
      "memory-core": { "enabled": false }
    }
  },
  "hooks": {
    "session-memory": { "enabled": false }
  }
}
```

If you leave Active Memory enabled, formative-memory auto-detects it and reduces its own recall limits to minimize double-injection, but disabling is the cleaner approach.

## Personalization via salience.md

A `salience.md` file in the memory directory guides auto-capture and explicit `memory_store` decisions. Write it in plain English — what matters to you, what to skip. This is where the personality-psychology angle becomes practical: you're effectively defining what your agent considers worth remembering.

## Try It

```bash
openclaw plugins install formative-memory
```

Restart the gateway. That's it — auto-recall, auto-capture, and nightly consolidation are all enabled by default.

The [GitHub repo](https://github.com/jarimustonen/formative-memory) has architecture docs and a glossary worth reading if you want to understand how the association graph and consolidation algorithm work. Mustonen is specifically looking for feedback on consolidation algorithm tuning and embedding model benchmarks.
