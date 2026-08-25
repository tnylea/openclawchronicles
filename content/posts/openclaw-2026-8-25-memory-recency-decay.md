---
title: "OpenClaw Memory Search Fixes Stale Ranking"
excerpt: "OpenClaw memory search now applies recency decay to nested and timestamped dated files, keeping stale notes from ranking as evergreen."
coverImage: '/assets/images/posts/openclaw-2026-8-25-memory-recency-decay.png'
date: '2026-08-25T08:06:00.000Z'
dateFormatted: August 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-25-memory-recency-decay.png'
---

OpenClaw memory search picked up a ranking repair in [PR #121103](https://github.com/openclaw/openclaw/pull/121103), which fixes how dated memory files are classified before recency decay is applied.

The short version: dated notes below `memory/` now age like dated notes, even when they live in subdirectories or include timestamped suffixes. That prevents old dreaming reports and session-memory snapshots from being treated as evergreen knowledge forever.

## What Was Broken

OpenClaw enables memory recency decay by default. The idea is simple: short-term notes should become less dominant over time, while curated long-term files such as `MEMORY.md` and `USER.md` can remain evergreen.

The bug was in the dated-file classifier. It recognized only root-level files shaped like `memory/YYYY-MM-DD.md`. That missed several real OpenClaw memory paths, including nested dreaming reports and the bundled session-memory hook's default timestamped snapshots.

The PR gives concrete examples that now decay by their embedded date:

- `memory/2025-01-01.md`
- `memory/2025-01-01-1430.md`
- `memory/2025-01-01-1430-2.md`
- `memory/dreaming/light/2025-01-01.md`
- `memory/dreaming/light/2025-01-01-vendor-pitch.md`
- Equivalent Windows-separated paths.

Before this fix, some of those files could keep full ranking weight indefinitely.

## Why The Fix Matters

Memory ranking is one of the places where agent quality quietly succeeds or fails. If old reset snapshots or dated reports are classified as evergreen, they can outrank fresher context and make an agent over-index on stale conclusions.

The fix updates `extensions/memory-core/src/memory/temporal-decay.ts` so the classifier follows the same dated-file shape already established by OpenClaw's short-term promotion utilities: a `YYYY-MM-DD` basename at any depth under `memory/`, with an optional nonempty suffix before `.md`.

The PR is careful about scope. It does not change databases, schema, indexing, retention, persistence, configuration, or migrations. It is a search-ranking classifier repair.

## What Stays Evergreen

The change keeps deliberately evergreen knowledge intact. `MEMORY.md`, `USER.md`, undated root or nested memory files, non-memory modification-time handling, and existing future-date behavior remain unchanged.

That distinction is the whole point. A dated note should age because it represents a point-in-time observation. A curated memory file should stay stable because a human or agent deliberately promoted it.

## Proof

The new regression cases failed against the previous classifier. One timestamped session memory kept a score of `0.95` when it should have decayed to approximately `0.000082`, and a nested Windows timestamped memory stayed above the expected threshold.

After the repair, the focused memory-owner and sibling suites passed: `temporal-decay.test.ts` and `hybrid.test.ts` reported 32 passing tests. The production source delta was only +1/-1, which is about as tidy as a ranking classifier fix gets.

For OpenClaw users, the practical result is better memory hygiene: old dated files age out of the top results, while intentional long-term memory remains available.
