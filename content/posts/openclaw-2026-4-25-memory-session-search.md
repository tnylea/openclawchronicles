---
title: "OpenClaw Memory Can Now Search Session Transcripts"
excerpt: "OpenClaw memory-core gains session transcript search via corpus=sessions, giving agents access to past conversation history alongside long-term memory files."
coverImage: '/assets/images/posts/openclaw-2026-4-25-memory-session-search.png'
date: '2026-04-25T08:05:00.000Z'
dateFormatted: April 25th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-25-memory-session-search.png'
---

OpenClaw agents have long had two kinds of memory: the long-term knowledge stored in `MEMORY.md` and indexed memory files, and the in-context transcript of the current conversation. What they could not do was **search past session transcripts** the way they search memory files. [PR #70761](https://github.com/openclaw/openclaw/pull/70761), merged today, bridges that gap.

## The New `corpus=sessions` Option

The `memory_search` tool — the primary way agents surface relevant information from memory — now accepts a `corpus` parameter with a new value:

- **`corpus=sessions`** — search past session transcripts
- **`corpus=memory`** — search long-term indexed memory files (now explicitly named)

The default behavior is unchanged, so existing agent prompts and skill files do not need updates. Agents that do not specify `corpus` continue to work exactly as before.

## How Session Visibility Works

Not every session is fair game for every search. The PR introduces a **session visibility layer** that filters results based on the requester's context:

- By default, agents see transcripts from sessions they participated in, including their own history.
- With `visibility=all`, cross-agent transcript access is enabled — useful in multi-agent setups where an orchestrator needs to review what a subagent discussed.
- The filter runs **post-query**, after the FTS and vector search stages, as a defense-in-depth measure against cross-session data leakage.

The visibility logic lives in a new `filterMemorySearchHitsBySessionVisibilityGuard` function, which loads the combined session store and applies the guard before results are returned.

## Plugin SDK Export

Session search visibility APIs are now exported from the plugin SDK (`plugin-sdk/memory-core`), meaning external plugins can build their own session-aware memory queries. The export sync (`pnpm plugin-sdk:sync-exports`) was run as part of the PR to keep package boundaries clean and contract tests green.

## Under the Hood

The implementation by [@nefainl](https://github.com/nefainl), reviewed by [@obviyus](https://github.com/obviyus), touches several layers:

- **`memory-core`** — new stem resolver for session transcript hits, `corpus=sessions` routing, source-scoped FTS and vector search
- **`gateway`** — `loadCombinedSessionStoreForGateway` extracted to `config/sessions` for reuse across memory and gateway paths
- **`scripts`** — plugin-sdk export sync to keep the manifest current

The QMD (quantized memory document) path also received an oversample-then-filter treatment for single-source recall, keeping result quality high when the session corpus is large. The implementation oversamples before applying visibility filters, then clamps to the requested `maxResults`, so you get good diversity without leaking out-of-scope sessions.

## Practical Impact

This is a meaningful upgrade for anyone building persistent, context-aware agents. An agent can now answer questions like "What did we discuss about project X last week?" by reaching into past session transcripts — not just `MEMORY.md`. Combined with the existing long-term memory recall path, OpenClaw agents now have a richer, session-aware memory graph to draw from.

A few example use cases this unlocks:

- **Meeting recap agents** that can reference previous meeting transcripts without you manually pasting them in
- **Support bots** that can check if a user's issue was discussed and partially resolved in a prior session
- **Personal assistants** that can remind you what you asked them to do yesterday, even after a session restart

Expect this in the upcoming `v2026.4.24` release. No configuration changes are needed — the new `corpus=sessions` option is available immediately to any skill or prompt that calls `memory_search`.

**Source:** [PR #70761 on GitHub](https://github.com/openclaw/openclaw/pull/70761)
