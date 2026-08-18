---
title: "OpenClaw Adds Chat History Cursor Deltas"
excerpt: "OpenClaw cached transcript revalidation now uses cursor deltas, cutting repeated chat history fetches from full tails to small updates."
coverImage: '/assets/images/posts/openclaw-2026-8-18-chat-history-cursor-deltas.png'
date: '2026-08-18T08:03:00.000Z'
dateFormatted: August 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-18-chat-history-cursor-deltas.png'
---

OpenClaw merged [PR #125606](https://github.com/openclaw/openclaw/pull/125606), adding cursor-based catch-up to cached chat history revalidation.

The problem was wasteful but important. Revalidating a cached session transcript refetched the full approximately 100-message tail even when the client was already current. The PR says that cost 5-16 KB on small sessions and hundreds of KB on real sessions because the history API had no forward catch-up direction.

For a Control UI that keeps recent sessions warm, those repeated tail fetches add up. Cursor deltas give OpenClaw a smaller way to ask, "what changed since the snapshot I already have?"

## What Changed

The new behavior adds Codex-app-server-style cursor catch-up to the existing `chat.history` and `chat.startup` methods. It does not introduce a separate RPC.

Tail pages now return an opaque `deltaCursor`, reusing the raw-delta codec's generation and last-sequence fence. Cursor requests return a closed union with either `kind: "delta"` or `kind: "reset"`.

Delta messages are projected through the same shared payload builder as live `session.message` broadcasts. That means their wire payloads are intended to be byte-identical to live events, reducing the chance that cached replay and live delivery drift apart.

On the client side, the Control UI replays catch-up messages through the same reducer used by live events, persists the cursor with the session snapshot, and re-warms prefetched sessions using cursor requests.

## Reset Instead Of Fragile Catch-Up

The PR deliberately keeps the first version bounded. If a generation changes after compaction or reset, the cursor is unknown, or the client is more than 200 projected events behind, the Gateway returns `reset`.

That reset is not treated as a user-facing error. The client falls back to the existing cursor-less tail fetch and recovers through the known full-history path.

This makes the change additive. Older clients are unaffected, and newer clients get the bandwidth win when the cursor is valid without being forced into an unbounded catch-up loop.

## User Impact

The PR estimates cached-session revalidation and background prefetch shrink from full tail pages to about 1 KB deltas, or roughly 200 bytes when the client is already current.

That should make recently used sessions feel warmer at a fraction of the traffic, especially on busy Gateways and UI sessions that revisit the same conversations often. CLI-imported sessions and cursor resets continue to degrade to the existing full-tail behavior.

There is no visual UI change. Rendered transcripts should look the same; the improvement is in how much data OpenClaw moves and how safely cached state converges.

## Evidence From The PR

The merged PR reports focused post-rebase suites across Gateway cursor behavior, Control UI cursor behavior, prefetch, snapshot storage, and protocol schema coverage. It also reports `pnpm ui:build` passing with Control UI performance budgets and a clean whole-branch autoreview.

Live verification used an isolated development Gateway and captured WebSocket frames. The test rig showed a first-touch full fetch followed by cursor-based reopens, cold-reload prefetch convergence after CLI-injected turns, reset recovery after compaction, and the expected delta-size reductions.

That live pass found two bugs, both fixed failing-test-first: an append-miss stub could clobber a persisted snapshot, and a WAL race could advance the delta cursor past the last projected event. The final tests cover both repairs.

For OpenClaw operators, this is the kind of infrastructure fix that is easy to miss in the UI but valuable over time. Faster, smaller transcript revalidation makes the chat surface cheaper to keep warm without changing how conversations appear.
