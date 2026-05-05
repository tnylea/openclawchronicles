---
title: "OpenClaw Memory Search Gets a 190x Speed Boost with sqlite-vec KNN"
excerpt: "A merged PR replaces OpenClaw's full-table-scan vector search with sqlite-vec KNN, cutting query time from ~8,490ms to ~50ms — a 190x improvement with no schema migration."
coverImage: '/assets/images/posts/openclaw-memory-search-190x-speedup.png'
date: '2026-04-23T08:00:00.000Z'
dateFormatted: April 23rd 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-memory-search-190x-speedup.png'
---

If memory search in your OpenClaw gateway has ever felt sluggish — especially on large workspaces with thousands of chunks — a freshly merged pull request just made it roughly 190 times faster. No configuration changes, no schema migration, no reindexing required.

## What Changed

PR [#69680](https://github.com/openclaw/openclaw/pull/69680) by contributor **aalekh-sarvam** replaces the `searchVector` function's SQL query with sqlite-vec's native **KNN (K-Nearest Neighbor) operator**. Previously, every vector search did a full table scan — computing cosine distance against every stored chunk before sorting results. The new approach lets sqlite-vec's `vec0` index walk shards directly, only computing final cosine scores on the candidates that actually matter.

The benchmark numbers are stark:

| Pattern | Time per query |
|---|---|
| Before (full table scan) | ~8,490 ms |
| After (sqlite-vec KNN) | ~50 ms |
| Speedup | **~190×** |

This was measured against a real 10,827-chunk workspace using 4096-dimensional Qwen3-Embedding-8B embeddings — a heavy, realistic workload.

## Why It Wasn't a Simple Fix

The naive approach — just switching to sqlite-vec's `v.distance` field for ordering — actually breaks results entirely. Here's why: sqlite-vec creates `chunks_vec` tables with **L2 distance** by default, not cosine distance. Using `v.distance` directly produces values that can exceed 1, which causes `score = 1 - dist` to go negative. The downstream `minScore` filter then drops every result silently.

The correct fix is more surgical: use `MATCH ? AND k = ?` solely for **candidate selection** (where the speedup lives), and keep `vec_distance_cosine()` in the `SELECT` for the **score**, preserving the existing cosine semantics exactly. The query vector is bound twice — once for the KNN match, once for the cosine calculation — but the result set and ordering are identical to the old implementation.

## What Stays the Same

- The fallback path (for installs without sqlite-vec) is untouched
- Existing schemas don't need migration or reindexing
- Score range and ordering behavior are semantically identical to before
- The fix targets the `extensions: memory-core` label — it's isolated to the memory search layer

## Why This Matters

Memory search is in the hot path for any agent that uses workspace context. With a large knowledge base, the old implementation could push concurrent tool calls into seconds-long queues. The PR author noted that end-to-end latency for memory tool calls dropped from **8–30 seconds** to around **2 seconds** in their setup — and the remaining 2 seconds is now dominated by merge/MMR/decay post-processing, a separate optimization target.

For users running OpenClaw against large codebases, documentation corpora, or long-running projects with extensive memory accumulation, this is a meaningful quality-of-life improvement that arrives without any action required on your part.

## When Does This Land?

The PR merged into `main` on April 23, 2026. It will ship in the next versioned release. If you're tracking `main` directly, you already have it.

---

*PR [#69680](https://github.com/openclaw/openclaw/pull/69680) · merged April 23, 2026 · contributor: [@aalekh-sarvam](https://github.com/aalekh-sarvam)*
