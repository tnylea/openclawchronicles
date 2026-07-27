---
title: "OpenClaw Closes Workspace Path Bypass"
excerpt: "OpenClaw merged a workspace sandbox fix that rejects symlink-plus-parent paths before they can escape the intended root."
coverImage: '/assets/images/posts/openclaw-2026-7-27-sandbox-path-bypass.png'
date: '2026-07-27T08:05:00.000Z'
dateFormatted: July 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-27-sandbox-path-bypass.png'
---

OpenClaw merged a security-focused agent sandbox repair this morning in [PR #113405, "security fix(agents): close symlink-then-.. workspace boundary bypass in assertSandboxPath"](https://github.com/openclaw/openclaw/pull/113405). The fix targets a POSIX path-validation gap where a path that looked normalized inside the workspace could still resolve outside it when the operating system followed a symlink and then processed `..`.

The PR describes the demonstrated shape plainly: a workspace path containing a symlink followed by a parent-directory segment could be approved as in-root, even though the raw OS operation reached a sibling file outside the workspace. That is exactly the kind of mismatch sandbox validators are supposed to prevent.

## What Changed

The shared validator now follows the raw parent chain more conservatively before it claims a path is safe. In practical terms, OpenClaw rejects the demonstrated symlink-then-parent escape instead of returning a misleading normalized in-root path.

The PR says the change:

- Preserves the raw parent chain for POSIX native realpath traversal.
- Treats a missing suffix conservatively from the nearest existing ancestor.
- Canonicalizes symlinked workspace roots.
- Preserves trailing-separator behavior.
- Leaves final-entry symlink and hardlink decisions to the existing alias policy.

Windows keeps its existing lexical behavior, with explicit platform coverage added for the contract.

## Why It Matters

OpenClaw agents often work inside a workspace with powerful filesystem tools. A validator that approves the wrong path shape can turn a normal file operation into a boundary failure, especially on systems where symlinks are common in development directories, monorepos, and mounted project trees.

This patch is intentionally scoped. The PR calls it "defense-in-depth" and says it is not a race-safe filesystem primitive. A time-of-check/time-of-use window can still exist if a symlink is swapped after validation and before the later operation. The operation-time containment work is tracked separately in #114382 and the broader fs-safe effort in #113705.

That caveat is important, but it does not make the fix minor. Blocking the known path shape at validation time removes a demonstrated escape from the common path while the deeper fs-safe migration continues.

## The Verification Trail

The PR includes before-and-after evidence from a fresh `origin/main` probe. Before the fix, the raw OS path read reached planted outside bytes while `assertSandboxPath` admitted the path. After the patch, the same raw-path read still showed the semantic escape, but `assertSandboxPath` rejected it with a sandbox-root boundary error.

The focused test run covered two files, 52 passing tests, and two Windows-only skips. The suite covers existing and missing targets, trailing separators, symlinked roots, raw final-entry alias policy, and contained symlink-parent write/edit behavior.

## Bottom Line

[PR #113405](https://github.com/openclaw/openclaw/pull/113405) is a narrow but high-value sandbox hardening patch. It does not claim to solve every filesystem race, but it closes a specific workspace-boundary bypass that could confuse lexical path approval with the operating system's real path resolution.

For operators running OpenClaw on POSIX hosts with agent file access enabled, this is one of the morning's most important merges to watch for in the next release.
