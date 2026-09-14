---
title: "OpenClaw Adds Repository-Free Remote Sessions"
excerpt: "OpenClaw PR #147773 lets users start cloud or paired-device sessions in a new isolated workspace without supplying a source repository."
coverImage: '/assets/images/posts/openclaw-2026-9-14-remote-sessions-new-workspace.png'
date: '2026-09-14T08:15:00.000Z'
dateFormatted: September 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-14-remote-sessions-new-workspace.png'
---

OpenClaw merged [PR #147773](https://github.com/openclaw/openclaw/pull/147773), adding a cleaner path for starting remote work when there is no source repository yet.

Before this change, starting a cloud or paired-device session required a repository, even for tasks that naturally begin in an empty folder. The PR says cloud selection could remain disabled while the Gateway checked Git availability. Now users can choose **New workspace** and start an empty, isolated session without supplying a repository or an initial commit.

## What Changed

The new workflow gives each fresh session its own backing repository through OpenClaw's existing managed-worktree owner. That preserves the durability model without forcing users to begin from a Git checkout.

Explicit folder and project selections still keep their source. Saved worktree preferences remain meaningful. Existing agent files are not copied into the new workspace. Git remains an internal dependency, and the normal snapshot, reclaim, and restore guarantees remain available.

The workspace choice also survives draft reload and placement recovery, which matters for a new-session UI where users may choose a destination, pause, or recover state before actually launching work.

## Why It Matters

Repository-first workflows make sense for code maintenance, but OpenClaw is increasingly used for work that starts as a blank canvas: drafting a small utility, exploring a new cloud task, testing an idea on a paired device, or asking an agent to create files from scratch.

For those cases, requiring a repository is ceremony. Worse, it can block the obvious path when the task does not yet have a source tree. Repository-free remote sessions make the remote execution path feel closer to how users think about the task: start with an empty workspace, then let the work produce its own artifacts.

## What Is Not Included

The PR is careful about scope. It relates to the empty-workspace portion of issue [#142521](https://github.com/openclaw/openclaw/pull/147773), but it does not claim to ship the broader multi-repository or explicitly ephemeral modes discussed there.

It also does not add a database migration or a new retention policy. The new path reuses the managed-worktree lifecycle, including creation, cancellation, recovery, and final snapshot cleanup.

## Validation

The PR reports a Gateway regression that failed against the original schema because the empty-workspace request was rejected, then passed with the change. The team also ran 296 focused tests across 14 files covering Gateway creation, worktree ownership and snapshot retention, UI source selection, preferences, and placement recovery.

Additional validation included core and UI typechecks, a full build, a clean public package build, 16 targeted browser end-to-end tests, and screenshot verification in real Chrome with synthetic data.

The most interesting proof used a real AWS worker. According to the PR, `sessions.create` produced an empty workspace without a source, dispatch allocated a cold AWS worker, a real model wrote and read `result.txt`, reclaim returned the exact bytes, deletion retained a snapshot, and restore recovered the same bytes. The lease, isolated Gateway, and tunnel were stopped cleanly afterward.

## The Bottom Line

PR #147773 makes OpenClaw's remote session model more flexible without giving up the managed-worktree guarantees that make recovery and snapshots useful. For users, the headline is refreshingly plain: you can start remote work without already having a repo.
