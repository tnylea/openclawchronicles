---
title: "OpenClaw Fixes Delegated Compaction Keys"
excerpt: "OpenClaw PR #120047 fixes delegated context-engine compaction by resolving authoritative session keys before transcript writes."
coverImage: '/assets/images/posts/openclaw-2026-8-6-delegated-compaction-session-keys.png'
date: '2026-08-06T23:01:00.000Z'
dateFormatted: August 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-6-delegated-compaction-session-keys.png'
---

OpenClaw merged [PR #120047, "fix(agents): resolve authoritative session keys for delegated compaction"](https://github.com/openclaw/openclaw/pull/120047), a late-night reliability fix for operators who delegate compaction to a plugin-owned `contextEngine`.

The bug was sharp because compaction appeared to fail for an unhelpful reason. According to the PR, delegated LLM compaction could end with `outcome=failed reason=unknown` when the runtime tried to persist the compacted transcript. The root cause was not the model or the context engine itself. A session UUID could be silently substituted where a session key was required, so the SQLite transcript write matched no row.

That is exactly the kind of identity drift that makes agent infrastructure hard to debug. The operator sees compaction fail, but the system has hidden the row-identity mismatch that would explain why.

## Explicit Session Intent

The repair centers on making session-key resolution explicit. `resolveAgentRunSessionTarget` now requires callers to declare whether a missing session key should create a new target or resolve an existing one.

That distinction matters. New embedded-agent admission can still mint a canonical agent-scoped key when public input omits one. Keyed-store consumers, including compaction, persistence, locks, successor paths, transcript rewrites, recovery targets, and deferred maintenance, now resolve the authoritative key through the session store or fail with a typed `session-key-missing` error.

The PR also removes the old fallback pattern where compaction-side code could fall back to `sessionId`. That fallback was convenient, but it let the wrong identifier masquerade as a key in paths that needed an existing transcript row.

## Better Failure Evidence

OpenClaw also changed transcript append handling from a generic boolean-style result into a typed result. Missing-row and rebound-row cases now carry codes and identity details, while duplicate appends remain a no-op.

SessionManager attaches that typed result as the error cause, so compaction can report `reason=transcript_persistence_failed` instead of a bland unknown failure.

For operators, the practical win is twofold:

- Delegated context-engine compaction should work again when the session exists.
- Genuine persistence failures should point at the row-identity problem instead of hiding it.

## Why This Is Worth Covering

Compaction is part of the long-running agent reliability story. When it works, agents keep useful context while reducing transcript size. When it fails silently, operators lose confidence in both memory behavior and plugin delegation.

PR #120047 closes that gap at the ownership boundary. The runtime must know whether it is creating a target or resolving an existing target, and transcript persistence must say which identity failed. That is not flashy, but it is the kind of foundation OpenClaw needs as more operators delegate core behavior to plugins.

The PR includes focused regression coverage across run-session target resolution, session accessors, SessionManager, compaction reasons, runtime compaction context, and compaction hooks.
