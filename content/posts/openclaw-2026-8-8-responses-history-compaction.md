---
title: "OpenClaw Preserves Responses History After Compaction"
excerpt: "OpenClaw PR #120729 keeps Responses compaction from dropping tool outputs or retrying from pruned history in long embedded sessions after checkpoint failure."
coverImage: '/assets/images/posts/openclaw-2026-8-8-responses-history-compaction.png'
date: '2026-08-08T23:03:00.000Z'
dateFormatted: August 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-8-responses-history-compaction.png'
---

OpenClaw merged [PR #120729, "fix(ai): preserve Responses history after compaction"](https://github.com/openclaw/openclaw/pull/120729) just before the nightly cutoff, landing a high-priority fix for long embedded Responses sessions.

The PR targets two related failures reported from long-running OpenAI Responses sessions. A `function_call_output` could arrive after compaction even though its matching `function_call` was already inside the compacted prefix. In that case, OpenClaw could drop the output because the normal pairing logic no longer saw the original call.

The second failure was more subtle. If a compaction checkpoint was rejected, retry could begin from an already-pruned suffix. That made it possible for a session to continue with a plausible answer that had quietly lost the older conversation history it needed.

## What Changed

The fix makes the replay plan preserve an immutable raw transcript before projection or pruning. The normal request still sends the compaction checkpoint with the chronological suffix, but a rejected checkpoint now rebuilds fallback history from the untouched full transcript instead of recycling the shortened request.

OpenClaw also keeps unframed function results in the narrow compaction replay window when their calls have moved into the compacted prefix. The PR says the existing pairing policy remains in place outside that window, so this is not a broad relaxation of tool-call framing.

The replay plan now runs through the SDK, SSE, WebSocket, and Azure success boundaries. That matters because Responses traffic can cross several transport paths, and fixing only one would leave long sessions exposed to the same data-loss shape in another route.

## Why It Matters

Compaction exists to keep large sessions useful, not to make them less reliable. For users running OpenClaw as a coding partner or research agent, missing tool output can make a later answer sound confident while resting on incomplete evidence.

This fix is especially relevant for embedded Responses sessions that run long enough to compact while still doing tool-heavy work. It protects the timeline: old calls can live in the compacted prefix, later outputs can still be retained, and fallback retry has access to the full conversation when a checkpoint fails.

## Validation

The PR reports 173 focused tests across OpenAI Responses compaction replay, prompt observation, transport transforms, encrypted retry behavior, shared Responses provider behavior, and Azure OpenAI Responses paths. It also lists `git diff --check`, formatter checks across 20 touched files, and a clean autoreview before rebase.

The production delta is modest for the affected surface: 15 files changed, with a net addition of 48 production lines and 201 test lines. For a P1 session-state bug, that is a focused patch with a lot of regression coverage around the exact failure mode.

OpenClaw users should not need to change configuration, storage, or protocol settings. The point of PR #120729 is to make long Responses sessions retain the history they already had.
