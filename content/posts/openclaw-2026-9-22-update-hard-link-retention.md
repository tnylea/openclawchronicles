---
title: "OpenClaw Updates Stop Copying Huge Runtime Trees"
excerpt: "OpenClaw PR #155977 speeds up update validation by retaining the running updater with hard links instead of copying package trees."
coverImage: '/assets/images/posts/openclaw-2026-9-22-update-hard-link-retention.png'
date: '2026-09-22T23:00:00.000Z'
dateFormatted: September 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-22-update-hard-link-retention.png'
---

OpenClaw merged [PR #155977](https://github.com/openclaw/openclaw/pull/155977), a P1 update-path fix that replaces a costly runtime tree copy with hard-link retention.

The problem showed up in `openclaw update`. The updater needs to keep its own package tree alive while the installer replaces the active package, so worker entrypoints can keep running through validation and activation. Before this change, that retention path byte-copied the full package root, including `dist/` and `node_modules`.

According to the PR, the 2026.9.6 candidate package had 37,309 files and weighed 625 MB. On the release Docker host, copying and verifying that tree moved at about 12 files per second. That pushed in-place global updates well past a 300-second end-to-end harness budget and caused the prerelease plugin update lane to time out before it could return JSON.

## What Changed

The new implementation keeps the same retention goal but avoids copying bytes when the filesystem can hard-link them. Files are linked into a private runtime directory, so the inventoried inodes survive npm rename and unlink operations. If linking is unavailable, such as across devices or on unsupported filesystems, the code falls back to copying.

The PR also folds multiple walks into one. Inventory checks, publication, relocation, and escape checks now happen per entry instead of across several full-tree passes. Files that must be rewritten in place, including selected pnpm metadata and `.bin` launchers, are still copied so the live package is not edited through a shared inode.

That balance matters. This is not an update integrity shortcut. The retained tree still checks that the private name points at the expected device and inode, keeps the IO budget watchdog, and leaves the shared candidate rehearsal snapshot behavior intact through a shared materialization helper.

## Why Users Should Care

The user-facing symptom was slow or failed updates, especially when validation needed to preserve a large installed package tree. Faster retention means update validation has more room to finish the work users actually care about: canary checks, activation, Doctor, and plugin consent reporting.

The proof in the PR is blunt. The failing path copied 6,402 files and 102 MB after nine minutes before the harness killed it. With the hard-link path, the same repro returned the expected denial payload with exit 0 and completed the whole update command in 3.5 minutes. Retention alone measured 33.9 seconds for a 38,678-file package, about 1,140 files per second.

## Evidence Behind the Merge

The validation covers both the happy path and the edge cases. Unit tests verify linked retention survives source replacement, `EXDEV` fallback copies bytes with the inventoried mode, changed entries are refused before linking, and relocated launchers leave the live file untouched.

The existing npm, pnpm, pnpm workspace, git, and git-linked layout tests also passed, along with the candidate plugin tree tests. The PR notes that `OPENCLAW_TESTBOX=1 pnpm check:changed` and the Docker `plugin-update` lane were run on the packed candidate.

For operators, the takeaway is refreshingly practical: OpenClaw updates should spend less time duplicating their own runtime and more time validating the new one.
