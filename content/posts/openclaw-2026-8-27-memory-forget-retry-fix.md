---
title: "OpenClaw Fixes Memory Forget Retry Gaps"
excerpt: "OpenClaw now purges remembered session content more completely after interrupted forget runs, consolidation, and custom session-store cleanup."
coverImage: '/assets/images/posts/openclaw-2026-8-27-memory-forget-retry-fix.png'
date: '2026-08-27T23:05:00.000Z'
dateFormatted: August 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-27-memory-forget-retry-fix.png'
---

OpenClaw merged a memory-core repair that tightens what happens when operators ask the system to forget session content. PR [#131179](https://github.com/openclaw/openclaw/pull/131179) fixes cases where deleted remembered content could still leave searchable chunks, cached embeddings, or rewrite backups after an interrupted purge or consolidation.

That matters because "forget" is only trustworthy if retrying it does not depend on fragile leftover metadata. The change is framed around retained provenance, derived indexes, plugin-state records, configured session stores, and exact selector behavior for channel-backed sessions.

## What Changed

The merged PR changes the order and scope of cleanup. Instead of removing source files first and risking the loss of evidence needed for a retry, OpenClaw now removes derived index and plugin-state records before deleting the files, corpus quotations, and origins that identify them.

The implementation also checks the selected agent's indexed snapshot as well as current files. That closes a shared-workspace edge case where one agent cleaning a workspace could otherwise hide another agent's remaining index records.

The practical result is a more durable forget path:

- Interrupted purges can be retried with the same selectors.
- Retained consolidation backups can be cleaned when they still reference forgotten parents.
- Configured session stores follow the same admission and deletion policy as default stores.
- IMAP, Gmail, and generic webhook selectors stay distinct instead of collapsing into a broad match.
- Deletes remain scoped to the selected agent rather than sweeping other agents' indexes.

## Why Operators Should Care

Memory systems create second-order artifacts. A transcript can produce chunks, embeddings, search rows, summaries, rewrite backups, and provenance records. If one layer is deleted while another remains searchable, the operator sees a confusing and risky state: the source looks gone, but retrieval can still surface pieces of it.

This PR is aimed at that exact failure mode. It keeps tombstones in place so source transcripts are not admitted again, and it preserves enough origin data to let a retry finish the cleanup instead of losing the map halfway through.

The change is especially relevant for shared workspaces and custom session stores. OpenClaw's memory model has to track both logical agent ownership and physical storage locations; the PR says session metadata and selectors now use the canonical session owner rather than a parallel SDK query implementation.

## Validation Notes

The PR reports real SQLite-store coverage and injected storage and filesystem failures. The regression set covered interrupted cleanup, embedding-cache leakage after reindex, stale shared-workspace indexes, lost consolidation-parent origins, configured stores, and exact IMAP selectors.

Maintainers also ran authenticated Gateway and Control UI proof against synthetic state. The live path included a failed purge, restart, forced reindex, retry, final search, and repeated forget check. After the retry, the target memory, corpus, staging, backup, and full-text-search content were absent.

There are explicit limits. The repair cannot reconstruct lineage already lost by older code, and two shared-store startup defects remain separate follow-ups. Still, for current and future forget operations, OpenClaw has a much stronger cleanup boundary.

## Bottom Line

OpenClaw's forget workflow now behaves more like a durable operation than a best-effort file delete. For teams using memory-core in regulated, multi-agent, or shared-workspace environments, that is an important reliability and privacy improvement.
