---
title: "OpenClaw Protects Worktrees From Cleanup"
excerpt: "OpenClaw PR #119709 protects registered Git worktrees from orphan cleanup when checkouts sit directly under the worktrees root."
coverImage: '/assets/images/posts/openclaw-2026-8-6-worktree-gc-protection.png'
date: '2026-08-06T08:01:00.000Z'
dateFormatted: August 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-6-worktree-gc-protection.png'
---

OpenClaw merged [PR #119709, "fix(worktrees): keep worktrees placed directly under the worktrees root"](https://github.com/openclaw/openclaw/pull/119709), a P0 fix for one of the more uncomfortable classes of agent-platform bugs: cleanup code touching real checkouts.

The problem affected operators who placed a Git worktree directly under OpenClaw's worktrees state root. In that layout, orphan garbage collection could misclassify the checkout's child directories as removable debris and recursively delete them. The PR notes that registered unborn worktrees and path aliases, including symlinked state roots, were also part of the risk surface.

That is not just a cosmetic cleanup issue. Worktrees are often where an agent is actively editing, testing, or staging a fix. If a maintenance pass removes files from a registered checkout, the agent loses working context and the operator may lose uncommitted work.

## One Preservation Rule Before Descent

The repair changes the ownership order. Before cleanup descends into a top-level or nested candidate, OpenClaw now classifies it through a preservation rule.

The rule uses Git's `worktree list --porcelain -z` registry from checkout roots, then canonicalizes both target and listed paths. That gives the cleanup pass a Git-backed view of what is actually registered instead of relying on a state-root layout assumption.

The same logic preserves both committed and unborn worktrees. If checkout metadata cannot be inspected safely, cleanup aborts instead of guessing. That fail-closed behavior is the important part: a suspicious directory remains on disk until OpenClaw can prove it is genuine debris.

The existing commit-required repository resolver is unchanged, so the fix narrows the garbage-collection boundary without reopening unrelated repository-resolution behavior.

## Why Operators Should Care

OpenClaw's worktree root is a high-value area. It can contain active branches, generated patches, review reproductions, and long-running task context. Cleanup routines need to be conservative there because the cost of a false positive is much higher than the cost of leaving a stale folder behind.

PR #119709 makes that tradeoff explicit. Registered Git worktrees remain intact whether they use OpenClaw's fingerprint layout or live directly below the worktrees root. Genuine unregistered debris can still be removed, but only after the new preservation check has had its say.

This matters most for self-hosted or power-user setups where users customize state paths, symlink storage, or keep multiple worktrees around for parallel agent work. Those are exactly the environments where a rigid layout assumption tends to break.

## Evidence

The PR includes before-and-after proof on an `origin/main` baseline. The defect reproduction covered direct child worktrees under the state root, registered unborn worktrees, and symlink-style aliases. The repaired behavior preserves those registered checkouts and avoids cleanup when the inspection boundary is not trustworthy.

The impact is simple: OpenClaw's orphan garbage collection should no longer treat real Git worktrees as trash just because they are placed directly under the worktrees root.

