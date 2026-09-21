---
title: "OpenClaw Moves Transcript Reads Off Gateway Threads"
excerpt: "OpenClaw PR #154318 moves transcript search and cursor history reads into a worker, cutting Gateway request-thread CPU while preserving bytes and order."
coverImage: '/assets/images/posts/openclaw-2026-9-21-transcript-worker-reads.png'
date: '2026-09-21T08:01:00.000Z'
dateFormatted: September 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-21-transcript-worker-reads.png'
---

OpenClaw merged a Gateway performance change in [PR #154318](https://github.com/openclaw/openclaw/pull/154318): durable transcript search and cursor-based chat history reads now run through the existing transcript worker instead of doing SQLite reads on the Gateway request thread.

That sounds like plumbing, but it affects one of the places where OpenClaw can feel slow under load. When one viewer asks for transcript search or cursor history, the Gateway should not make other viewers wait on the same request thread while storage work runs.

## What changed

The PR moves two read paths off the caller thread:

- Durable transcript search
- Cursor-based `chat.history` reads

The implementation keeps the existing read-only worker scope and database lifecycle. Workers return raw history delta facts and search results, while the main thread keeps responsibility for profile display projection, visibility checks, and publication.

OpenClaw's normal history pages already used workers, and the PR is explicit that this is a first migration cut rather than a complete repository-wide conversion. Several related storage paths remain future work, including projection hydration, archived materialization, pending inputs, subagent visibility reads, and PR-reference revision reads.

## Why it matters

Gateway request threads sit in a sensitive position. If they get tied up doing storage reads, the slowdown can spread from one expensive request to unrelated viewers. Moving heavier transcript reads into the worker keeps the request path more responsive without changing the stored data model.

The PR also keeps the compatibility contract tight. Message bytes, ordering, filtering, sharing authority, and history budgets are preserved. The author says no configuration, schema, retention, or update changes are required.

That is the right shape for a storage migration: reduce contention first, then keep the behavioral surface boring.

## Performance notes

The PR reports same-machine Blacksmith Testbox measurements with 5,000 session rows and 50 concurrent viewers or calls. The most dramatic change is transcript search: main-thread CPU dropped from 8.639 ms to 0.281 ms per measured call, a 96.7 percent reduction.

The tradeoff is modest wall-time overhead for search because the worker hop is now in the path. The reported amortized wall moved from 8.630 ms to 8.998 ms. In other words, OpenClaw is trading a small per-call cost for freeing the Gateway request thread, which is usually the better bargain under concurrent use.

Cursor history also stopped doing native delta reads on the host side in the measured run. The warm `sessions.list` path was included as a control and is not claimed as a speedup.

## Validation notes

The PR includes byte-for-byte style regression coverage around complete history responses, search ordering, ranks, snippets, and serialized bytes against the native query kernel. It also covers branch resets, sharing revocation, retained-history authority, incognito behavior, worker close and replacement, cold storage, Doctor, and embedded callers.

The final exact-head CI passed after one unrelated timing-sensitive shard was rerun under maintainer direction. No production or test code changed for that rerun. The resulting change is a focused Gateway responsiveness improvement with careful proof around transcript compatibility.
