---
title: "OpenClaw Preserves Host Files After Failed Writes"
excerpt: "OpenClaw now preserves existing unrestricted host files when write or edit operations fail partway through filesystem replacement."
coverImage: '/assets/images/posts/openclaw-2026-8-22-host-file-write-preservation.png'
date: '2026-08-22T08:01:00.000Z'
dateFormatted: August 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-22-host-file-write-preservation.png'
---

OpenClaw merged a data-preservation fix this morning: [PR #118470](https://github.com/openclaw/openclaw/pull/118470) changes how unrestricted host `write` and `edit` tools update existing regular files.

The bug sat in a failure path that matters precisely because agents touch real files. The shared host writer previously used a truncate-first write path for existing files. If the filesystem failed mid-write, the original file could be destroyed and replaced by a partial result.

The PR's reproduction used a real file-size limit and showed the failure mode clearly: the requested replacement did not complete, and the original bytes were not preserved.

## Safer Existing-File Updates

The shared owner is `writeHostFile` in `src/agents/agent-tools.read.ts`. That code now treats existing regular files differently from missing or non-regular targets.

For an existing regular file, OpenClaw opens the file with read/write access, preserves the overwritten prefix, writes growth beyond the old end before changing original bytes, then overwrites and shrinks. If a rejected phase occurs, it restores the preserved prefix and original size.

That means a failed write is still a failure, but it is no longer allowed to casually turn a good file into a partial replacement.

The PR also records one important maintainer decision: a file that is writable but unreadable fails before mutation. That is the conservative behavior because rollback requires the original bytes. If OpenClaw cannot read what it would need to restore, it should not start modifying the file.

## Why It Matters for Agents

This is not a cosmetic filesystem detail. Agents often edit configuration, scripts, notes, generated artifacts, and project files. When a write fails because of quota, file-size limits, disk behavior, or permission edge cases, preserving the previous content is part of the trust contract.

[PR #118470](https://github.com/openclaw/openclaw/pull/118470) keeps the repair at the owner boundary. It affects unrestricted host `write` and `edit`, while leaving sibling write paths such as workspace-only writes, sandbox bridge writes, and `apply_patch` under their existing owners and contracts.

For users, the visible outcome is simple:

- failed host writes should no longer truncate a healthy existing regular file;
- unreadable existing files fail before mutation;
- symlink, hard-link, inode, mode, ownership, parent creation, UTF-8 growth, shorter write, and empty-write behavior are covered by regression tests.

## Validation

The PR reports strong failure-proof coverage. The identical regression file produced 18 failures on pre-fix production code and passes after the repair.

Focused local proof included `git diff --check`, formatting and lint checks, `pnpm tsgo`, assertion-safety checks, and a grouped owner-prefix Vitest run with 104 passed tests and 4 skipped tests. The regression suite drives the real host `write` and `edit` factories instead of only testing a helper in isolation.

The PR also states the known boundary: power loss, process termination, and a rollback write that independently fails remain outside this process-level guarantee.

## Bottom Line

OpenClaw's unrestricted host file tools now behave more like careful editors than blunt overwrites. When an existing regular file cannot be replaced cleanly, the old content gets a much better chance of surviving intact.

That matters for any operator who lets agents work directly on real project or host files.
