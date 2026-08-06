---
title: "OpenClaw Clarifies Memory Vector Status"
excerpt: "OpenClaw PR #120048 updates memory status so built vector indexes no longer appear as unknown on the fast CLI path."
coverImage: '/assets/images/posts/openclaw-2026-8-6-memory-vector-index-status.png'
date: '2026-08-06T23:03:00.000Z'
dateFormatted: August 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-6-memory-vector-index-status.png'
---

OpenClaw merged [PR #120048, "fix(memory): report persisted vector index state on unprobed status path"](https://github.com/openclaw/openclaw/pull/120048), a memory observability fix for `openclaw memory status`.

Before this change, the plain status command could report `Vector store: unknown` on first invocation even when the vector index was already built. The fast path created a fresh manager with no cached vector availability and did not probe `sqlite-vec`, so operators saw an ambiguous status instead of the real persisted-index state.

The problem was not that vector search was unavailable. The problem was that the cheap status path could not distinguish "not probed yet" from "not indexed."

## Indexed But Unprobed

The repair adds a typed persisted-index state derived from existing SQLite metadata and OpenClaw's clean/rebuild marker. Instead of jumping straight from row counts to "ready," the command can now describe the index as one of several states:

- `complete`
- `incomplete`
- `empty`
- `unverified`

When the index is complete but the native vector extension has not been loaded on the fast path, plain status renders it as `Vector store: indexed (unprobed)`.

That wording is deliberately conservative. It tells the operator that the persisted index exists without pretending the current process has verified extension availability. Deep checks still own the authoritative probe.

## No Expensive Probe On The Fast Path

The PR avoids turning a quick status check into a heavy initialization path. It uses cheap SQLite metadata reads and does not load the native extension or embedding provider just to print the basic status.

That preserves the role split:

- `openclaw memory status` can show the persisted index state quickly.
- `openclaw memory status --deep` and `openclaw memory status --index` remain probe-authoritative.
- Top-level `openclaw status` already performs probing where that behavior is expected.

JSON output also gains an additive `vector.index` field, giving automation a more precise state without breaking the existing memory-host SDK surface.

## Why This Helps

Memory status is one of the first commands operators run when semantic recall feels off. A false `unknown` result sends people down the wrong path, especially after they have already built or rebuilt an index.

PR #120048 makes the fast path honest. A complete persisted index is shown as indexed, incomplete or legacy states are called out more clearly, and empty stores still stay unknown until there is something meaningful to report.

The PR includes focused coverage across vector rebuild state, memory CLI output, and memory indexing behavior. It also notes that rebuild decisions are preserved by deriving status and rebuild logic from the same resolver.
