---
title: "OpenClaw Fixes Unix PATH Persistence"
excerpt: "OpenClaw's Unix installer now persists PATH setup across Bash, zsh, Fish, and fallback shells so fresh terminals can find the CLI."
coverImage: '/assets/images/posts/openclaw-2026-8-17-unix-path-installer-fix.png'
date: '2026-08-17T08:01:00.000Z'
dateFormatted: August 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-17-unix-path-installer-fix.png'
---

OpenClaw merged a P0 installer repair in [PR #124779](https://github.com/openclaw/openclaw/pull/124779), fixing a frustrating Unix setup failure where installation could appear successful but the `openclaw` command was missing in a fresh terminal.

The bug was not about whether the current installer process could find OpenClaw. It was about persistence. The installer could repair its own active PATH or write to the wrong shell startup file, leaving the next login or interactive shell without the command users had just installed.

## What Changed

The installer now owns persistent PATH setup for the common Unix shell paths instead of treating them as a best-effort side effect.

The PR says the new flow covers:

- Bash login-file precedence
- zsh startup files
- Fish `conf.d`
- unknown-shell fallbacks
- users with multiple shell targets
- unsafe symlink refusal
- partial-target failure handling
- metadata-preserving atomic replacements

That is a broad surface for what looks like a small installer fix. It matters because shell startup rules are full of edge cases. Bash can choose among several login files. Fish expects configuration in a different shape. Some users switch shells or have several valid startup targets. A safe installer has to update the files that will actually run later without trampling unsafe paths.

## Why It Matters

For a tool like OpenClaw, a failed PATH handoff is a first-run reliability problem. The user may have a working package on disk, but the next obvious action, opening a terminal and typing `openclaw`, fails.

That kind of failure is especially costly for new users because it looks like the install itself was broken. It also creates needless support load: the fix is often "edit your shell profile," but the user should not have to know which profile file is active.

PR #124779 moves that responsibility into the installer. After installation, the CLI should remain discoverable in fresh login and interactive shells. If a target is unsafe or unwritable, the installer can skip that target without blocking safe updates elsewhere.

## Safety Boundaries

The patch is careful about the failure modes that matter for dotfile writes. The PR explicitly calls out refusal of unsafe symlink targets and atomic replacement that preserves metadata. That combination is important: installers should not follow a surprising symlink into a sensitive file, and they should not casually rewrite shell startup files in a way that loses permissions or ownership expectations.

The result is a more boring setup experience, which is exactly what a CLI installer should aim for.

## Evidence From The PR

The merged PR reports 100 focused `install-sh` Vitest tests passing on Node 24.19.0. Coverage includes Bash, zsh, Fish, unknown-shell selection, Bash login precedence, dual-shell intent, Fish `conf.d`, symlink refusal, partial-target failure, metadata preservation, and atomic replacement.

Additional checks included `bash -n scripts/install.sh`, `git diff --check`, a clean TruffleHog diff scan, and an independent final review with no P0-P2 findings.

For OpenClaw users, the visible takeaway is simple: a successful Unix install should now leave `openclaw` available when the next terminal starts.
