---
title: "OpenClaw Fixes Repeated Worktree Cleanup Errors"
excerpt: "OpenClaw PR #128761 stops expired agent worktrees from logging the same startup cleanup failure on every Gateway restart."
coverImage: '/assets/images/posts/openclaw-2026-8-24-worktree-cleanup-errors.png'
date: '2026-08-24T23:01:00.000Z'
dateFormatted: August 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-24-worktree-cleanup-errors.png'
---

OpenClaw merged [PR #128761, "fix(worktrees): stop repeated startup cleanup errors"](https://github.com/openclaw/openclaw/pull/128761), a P1 repair for Gateway maintenance around expired session and workboard checkouts.

The problem showed up when an expired checkout contained an ignored nested linked agent worktree. On Gateway startup, and again during the hourly post-ready maintenance sweep, OpenClaw could try to snapshot the checkout, fail, leave the expired checkout registered, and then repeat the same warning on the next sweep.

That kind of repeated warning is more than log noise. It tells operators that cleanup did not converge, leaves stale state visible, and makes it harder to distinguish a real new filesystem problem from yesterday's already-known failure.

## What Changed

The PR tightens the rule for when nested repositories can be treated as disposable during managed worktree garbage collection.

OpenClaw now constrains nested-repository snapshot safety to Git-discovered visible and ignored paths. An ignored nested checkout is treated as removable only when the owning repository's authoritative Git worktree registry confirms it belongs to that same repository.

The boundary is deliberately conservative. Git-visible nested repositories, ignored foreign repositories, and tracked mode-160000 gitlinks still fail closed. Same-repository ignored linked worktrees can be removed as part of expired checkout cleanup, but independently owned nested repositories remain protected.

## Why It Matters

Agent systems generate a lot of short-lived working directories. Sessions, workboards, background workers, and delegated agents all need cleanup paths that are boringly reliable. When the cleanup owner cannot tell the difference between a stale child worktree and an independently owned nested repository, the safe answer is to stop and preserve data.

PR #128761 keeps that preservation rule, but makes the same-repository linked-worktree case explicit enough that stale OpenClaw-owned state can actually be collected.

The expected user impact is straightforward:

- Expired checkouts with ignored same-repository linked agent worktrees clean up once.
- Stale linked-worktree registrations are pruned.
- Startup and hourly Gateway maintenance stop repeating the same cleanup warning.
- Foreign nested repositories remain protected, including ignored repositories and metadata-only repositories.

## Evidence

The PR includes pre-fix evidence where the targeted garbage-collection regression failed because the ignored nested repository remained registered. It also adds a foreign-ownership regression that initially failed on the reviewed head, proving the dangerous case: an independently owned ignored repository could otherwise be deleted.

Validation covered real Git fixtures, owner removal, stale registration pruning, a follow-up sweep with no recurring removal, registered-orphan preservation, live run leases, and Gateway maintenance scheduling.

The production change is small for the risk involved: the PR reports a net 20 production lines, with the larger test movement focused on the repository-ownership boundary.

## Bottom Line

PR #128761 makes OpenClaw's worktree cleanup more predictable without relaxing the safety guard around user-owned repositories.

For operators, the visible win is quiet Gateway maintenance after expired agent checkouts are cleaned. For maintainers, the more important win is that OpenClaw now has a sharper test-backed rule for disposable nested agent worktrees versus repositories it must preserve.
