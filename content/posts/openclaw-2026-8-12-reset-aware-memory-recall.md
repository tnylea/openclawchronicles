---
title: "OpenClaw Fixes Reset-Aware Memory Recall"
excerpt: "OpenClaw Active Memory can now recall private pre-reset context while excluding current, deleted, shared, stale, and cross-agent transcript hits."
coverImage: '/assets/images/posts/openclaw-2026-8-12-reset-aware-memory-recall.png'
date: '2026-08-12T23:03:00.000Z'
dateFormatted: August 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-12-reset-aware-memory-recall.png'
---

OpenClaw merged an Active Memory fix for private conversations after a session reset. [PR #122051](https://github.com/openclaw/openclaw/pull/122051), titled "fix(memory): recall prior conversation after session reset," repairs a boundary case in the canonical SQLite reset path.

The issue was subtle: a modern reset keeps one durable session identity and appends a reset boundary to the transcript. Without reset-generation-aware indexing and authorization, OpenClaw could filter the prior private generation together with the live transcript. The result was that Active Memory lost access to the immediately prior private context even when that context should have remained recallable.

## The Reset Boundary Problem

Resetting a session is not the same as deleting every historical signal. It creates a new live generation while retaining a durable session identity. That is useful for continuity, but it raises a privacy and authorization question: which memory chunks belong to the old generation, which belong to the current generation, and which should be excluded entirely?

[PR #122051](https://github.com/openclaw/openclaw/pull/122051) resolves that by treating the reset boundary as part of the memory index contract. OpenClaw now finds the latest SQLite reset boundary, treats `firstKeptEntryId` as the live-generation start, and splits pre-reset and current-generation chunks independently.

## What Changed

The fix includes boundary metadata in the session index hash, forcing a reindex when only the reset generation changes. That keeps memory search from reusing an index that no longer matches the live reset boundary.

Authorization also recomputes the boundary from trusted current agent, session, and store identity. Only hits wholly before the cutoff are accepted for the pre-reset recall path. Hits that cross the boundary or belong to the current generation are rejected.

The fail-closed list is the real safety story. OpenClaw rejects malformed, stale, crossing, current, deleted, shared, cross-agent, and alias-conflicted hits. Legacy `.jsonl.reset.*` support stays as compatibility only; the canonical proof uses the current SQLite session path.

## User Impact

After a private session reset, Active Memory can now recall the immediately prior private generation when it is authorized to do so. At the same time, it keeps unrelated, deleted, shared, current-tail, and peer-agent transcript hits out of accepted recall evidence.

That balance matters. Memory that forgets too aggressively feels broken. Memory that recalls across the wrong boundary feels unsafe. This change is aimed at the narrow middle: recall the prior private generation, but only when the reset boundary and ownership evidence support it.

## Verification

The PR includes reset-boundary resolver tests, SQLite session-file/index/hash coverage, memory visibility and boundary-chunk tests, QA helper and catalog checks, core TypeScript validation, formatting and lint checks, Plugin SDK baseline checks, and a supported isolated Linux Gateway plus QA-channel scenario.

The supported scenario used a real `sessions.reset`, retained the durable session ID, proved the private fact was strictly before the effective reset cutoff, found it under the canonical SQLite path, and recalled it through Active Memory. Deleted, group, and peer-agent controls were indexed and then excluded from accepted recall evidence.

## The Bottom Line

[PR #122051](https://github.com/openclaw/openclaw/pull/122051) is a precise memory reliability fix with security-boundary implications. It lets OpenClaw remember what it should remember after a reset, while refusing the transcript hits that would make recall too broad.
