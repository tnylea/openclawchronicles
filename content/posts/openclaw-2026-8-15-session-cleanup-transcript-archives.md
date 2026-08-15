---
title: "OpenClaw Cleanup Now Preserves Transcript Archives"
excerpt: "OpenClaw session cleanup now fails safe on malformed transcript rows and writes recoverable archives before deleting readable agent history during cleanup."
coverImage: '/assets/images/posts/openclaw-2026-8-15-session-cleanup-transcript-archives.png'
date: '2026-08-15T23:10:00.000Z'
dateFormatted: August 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-15-session-cleanup-transcript-archives.png'
---

OpenClaw merged a session cleanup safety fix today that should reassure anyone who relies on long-running agents and durable transcripts. [PR #123495](https://github.com/openclaw/openclaw/pull/123495), "fix(sessions): prevent cleanup from deleting readable transcripts," changes how cleanup handles malformed SQLite transcript rows.

The bug affected operators running `openclaw sessions cleanup --fix-missing`, and the same cleanup owner also backs the `sessions.cleanup` Gateway RPC. When one transcript row was malformed, the cleanup classifier could treat the read failure as evidence that the whole transcript was message-free. That could remove the session and transcript rows without a recoverable archive, even when other transcript content was still readable.

## The New Rule: Fail Safe

The cleanup classifier now inspects transcript events and the deletion snapshot together. If content is malformed or unreadable, OpenClaw keeps the session instead of classifying it as empty.

That distinction matters. A damaged row does not prove the transcript has no value. It proves cleanup should slow down and preserve recoverability.

For sessions that are eligible for cleanup, the deletion decision is now bound to the inspected snapshot. If the transcript changes after inspection, cleanup cannot delete it under a stale decision.

## Same-Transaction Archives

The larger part of the fix is archival. Transcript archival now belongs to the per-agent SQLite lifecycle transaction. OpenClaw lazily installs an additive table that stores:

- The canonical compressed archive.
- A digest.
- The deletion reason.
- Publication state.

That archive is committed in the same transaction that removes the session state. After commit, a bounded publisher writes the derived `.deleted` artifact, avoids overwriting existing files, verifies the digest, and retries pending publication after interruption.

Retention and disk-budget cleanup now prune only published archives and protect unpublished recovery copies.

## Why This Is Bigger Than One CLI Flag

The surface area is broader than a cleanup command. Session cleanup is part of keeping long-lived OpenClaw installations healthy. If cleanup is too timid, old state piles up. If cleanup is too aggressive, it can erase the context that makes an agent useful.

This fix moves the behavior toward a better contract: cleanup can reclaim space, but only after it has a recoverable copy or a defensible reason to keep the session.

The PR notes that no SQLite schema-version bump is required. The table is additive, lazily ensured on first use, and validated against previous-reader and drift cases.

## Evidence

The PR reports that the original regression cases failed before the repair and passed after it: readable-plus-malformed content was deleted, and a qualifying `--fix-missing` removal produced no archive.

The focused exact-head suite covered nine files and 201 tests, including cleanup classification, rollback atomicity, crash and retry publication, collisions, lifecycle races, retention, disk pressure, schema compatibility, and maintenance paths.

For operators, the headline is simple: cleanup no longer silently destroys a readable conversation because another row is malformed. If OpenClaw intentionally reclaims transcript content, a recovery copy is committed atomically first.

Source: [OpenClaw PR #123495](https://github.com/openclaw/openclaw/pull/123495)
