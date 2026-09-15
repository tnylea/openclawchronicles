---
title: "OpenClaw Stops Revoked Session Restores"
excerpt: "OpenClaw PR #149333 prevents revoked history reads from restoring cold transcript rows and trims large rebuild checks."
coverImage: '/assets/images/posts/openclaw-2026-9-15-revoked-session-restores.png'
date: '2026-09-15T23:03:00.000Z'
dateFormatted: September 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-15-revoked-session-restores.png'
---

OpenClaw merged [PR #149333](https://github.com/openclaw/openclaw/pull/149333), a P2 Gateway and sessions fix for revoked history reads and oversized transcript rebuild checks.

The problem was subtle but consequential. A history read could restore cold transcript rows after its database closed, then reject the result as revoked. In a separate performance path, rebuild checks scanned entire oversized transcripts before deciding the rebuild should be deferred.

Both behaviors lived in OpenClaw's session-history machinery, where correctness and bounded work matter. Transcript recovery should not mutate a replacement database after the caller has lost authority, and large histories should not require unnecessary synchronous scanning just to reach a known threshold.

## What Changed

The fix carries the existing history owner's live authority through cold-restoration queue waits and into the native commit guard. If the read is revoked, replacement database contents stay intact.

The rebuild path now bounds stored-event sizing to the remaining 4,000-row budget plus one. That preserves SQLite's ability to read byte lengths without pulling overflow payloads across the full transcript.

The PR also shares query and comparison helpers between the relevant entry points, and reconciliation reuses its newest-sequence observation.

For users and operators, the important effects are:

- Revoked history reads no longer restore rows into a replacement database.
- Oversized transcript checks do less synchronous preflight work.
- Existing row and byte thresholds stay unchanged.
- Transcript contents, reader snapshots, and native mutation settlement stay unchanged.
- No schema or configuration migration is required.

## Why It Matters

OpenClaw sessions can outlive restarts, compactions, cold storage moves, and native UI reconnects. That durability is useful only if recovery respects ownership at every boundary.

This PR tightens that boundary. A read that no longer has live authority should not be able to restore cold rows after the database has moved on. That protects the canonical session state and reduces the chance of confusing follow-up reads.

The performance side matters for a different reason. Large transcripts are normal in long-running agent work. Bounding the rebuild preflight keeps the Gateway from spending synchronous time on rows that cannot change the decision.

## The Proof

The PR reports three regression paths that failed before the repair: a history read paused before restoration, another paused inside its cold queue, and a native commit-boundary case that ignored caller revocation. After the fix, those paths preserve the cold descriptor and canonical rows.

Two row-budget cases previously performed 8,000 size evaluations instead of the intended 4,001 or 4,000 bounds. Those now pass.

The five focused session and history files passed 75 cases. After a final query-helper cleanup, all 40 affected index and search cases passed again. Complete changed-file checks and independent P0-P2 review also passed.

The PR includes component timings on synthetic in-memory SQLite. For one million events, rebuild sizing fell from 63.543 ms to 0.360 ms because the check sizes 4,001 rows instead of the entire event set.

## What To Watch

This is not a new feature surface. It is a correctness and efficiency fix in the machinery that keeps long histories coherent.

For users, the visible effect should be quieter: revoked reads should leave replacement session contents alone, and very large transcripts should trigger less unnecessary Gateway work during rebuild decisions.
