---
title: "OpenClaw Memory Indexing Keeps Its Database"
excerpt: "OpenClaw PR #155535 keeps memory indexing bound to the selected SQLite database when publication commands queue behind other work."
coverImage: '/assets/images/posts/openclaw-2026-9-22-memory-indexing-queue.png'
date: '2026-09-22T08:00:00.000Z'
dateFormatted: September 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-22-memory-indexing-queue.png'
---

OpenClaw merged [PR #155535](https://github.com/openclaw/openclaw/pull/155535), a focused fix for a memory-indexing failure that could appear when SQLite commands queued in just the wrong order.

The failure message was specific: `Memory source owner changed before replacement`. According to the PR, the reindex operation kept its temporary shadow database in the caller's async-local context, but a queued ownership guard could later run from a worker-reply callback without that context. That meant the guard could compare the shadow database against the published database and stop a valid indexing operation.

## What Changed

The repair keeps memory indexing tied to the database it originally selected when publication commands have to wait behind other SQLite work. The PR says actual owner revocation, database closure or replacement, and provider-generation changes still stop the operation through the same live checks.

That last detail is important. This is not a loosening of the memory-store safety model. The fix preserves the same ownership checks, but makes sure those checks run with the right per-command context after the broker and native worker queue hand work back.

The SQLite client already captured caller context for the operation-admission factory. PR #155535 extends that idea so the queued `assertCurrent` callback uses the same kind of bound snapshot. Guard-only operations also capture their own snapshot.

## Why Users Should Care

Memory indexing is one of those background systems that users mostly notice when it breaks. If OpenClaw is rebuilding or publishing memory data, a false owner-change failure can interrupt recall quality without pointing to an obvious user action.

With this merge, a valid reindex can survive normal queueing inside the SQLite worker path. Operators do not need a migration, new configuration, or public API change. The behavior is meant to become more predictable under load while preserving the revocation and database-generation boundaries that prevent stale work from publishing into the wrong store.

## Evidence Behind the Merge

The PR includes a controlled reproduction on unchanged main production code. The existing source-wide memory case can fail when an absent-stage discard is queued immediately before the first `stage.start`; the discard does not mutate SQL or staging state, but it is enough to expose the missing context.

The new coverage uses the real broker and native worker queue for both guard-only and write-admission operations. It verifies live and revoked owners, persisted rows, and restoration of the outer context without adding timers or retry loops.

Validation also covered the broader memory surface. The original 20-file memory group passed three runs with 228 cases each, the complete memory index file passed twenty standalone runs, and the affected client, admission, shadow-database, and publication sibling files all passed. Hosted CI and ClawSweeper review also completed cleanly.

For OpenClaw users, the headline is simple: memory indexing now has a stronger grip on the exact database it is supposed to publish, even when the worker queue gets busy.
