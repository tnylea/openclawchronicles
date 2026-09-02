---
title: "OpenClaw Cuts Memory Search Rebuilds"
excerpt: "OpenClaw memory search can now refresh dirty files and session transcripts without repeatedly forcing full index rebuilds."
coverImage: '/assets/images/posts/openclaw-2026-9-2-memory-search-incremental-rebuilds.png'
date: '2026-09-02T08:04:00.000Z'
dateFormatted: September 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-2-memory-search-incremental-rebuilds.png'
---

OpenClaw merged a memory-core reliability fix this morning with [PR #136064](https://github.com/openclaw/openclaw/pull/136064), `fix(memory): avoid unnecessary full rebuilds during memory search`. The change targets a production-observed failure mode where dirty memory searches repeatedly launched full shadow rebuilds instead of indexing only pending changes.

For busy agents, that is more than a background inefficiency. The PR describes a production Gateway where every dirty search started a multi-minute full rebuild. During those rebuilds, large embedding-cache seed commits could block the event loop for seconds, and incremental `session-delta` syncs repeatedly failed because the memory reindex lock was held.

## What Changed

The serving manager already owns a complete dirty-generation snapshot. OpenClaw now lets the transient maintenance manager adopt that snapshot through the existing restoration logic, then sync without forcing a full rebuild.

That means `runSync` can choose the appropriate path:

- Incremental work for dirty memory files.
- Incremental work for dirty session transcripts.
- A genuine full retry when the generation actually requires it.
- Restoration of handed-off state when maintenance fails or stays incomplete.

The PR also reduces embedding-cache seed commits from 1,000 rows to 100 rows while preserving the per-batch event-loop yield. That boundary is important because the production report included roughly 28 KB rows, where 1,000-row synchronous commits could take seconds.

## Why This Matters

OpenClaw memory search is most valuable when it stays available while the agent is still learning from files and sessions. If every dirty search pushes the system into a full rebuild, search becomes a source of lock contention instead of a responsive retrieval surface.

The fix keeps searches available during maintenance and lets dirty content become searchable afterward without treating every pending update as an index disaster. It also leaves separate work alone: revision-conflict retry policy and clean CLI search behavior are explicitly outside the scope of this PR.

No new Plugin SDK exports, configuration options, schemas, revision fences, reindex locks, or publication-generation leases were added.

## Proof From The Merge

The PR extends the existing published-index availability fixture rather than creating a disconnected test. The updated fixture exercises memory dirtiness, one dirty session, and a full-memory retry against real SQLite indexing and searches.

Before the fix, the incremental regression cases failed because `runInPlaceReindex` was called when it should not have been. The full-memory-retry case already passed, which helped prove the repair was preserving the genuine rebuild path.

Final validation reported 23 passes in `manager-search-orchestration.test.ts`, 36 passes across the sync-ops tests, 17 passes in reindex recovery, and 1,409 passes across `extensions/memory-core`, with three Windows-only tests skipped. Changed-file checks, formatting, linting, import-cycle checks, and Codex autoreview also passed.

## Operator Takeaway

PR #136064 should make memory search less disruptive on active OpenClaw agents. Dirty files and session transcripts can be picked up incrementally, while full rebuilds remain available for cases that truly need them.
