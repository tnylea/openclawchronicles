---
title: "OpenClaw Preserves Install Dependencies"
excerpt: "OpenClaw's postinstall and Doctor flows now preserve shared runtime dependency roots used by other installs, profiles, and live consumers."
coverImage: '/assets/images/posts/openclaw-2026-9-4-install-doctor-dependencies.png'
date: '2026-09-04T08:15:00.000Z'
dateFormatted: September 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-4-install-doctor-dependencies.png'
---

OpenClaw has shipped a high-priority compatibility fix for package installation and Doctor repair flows. The short version: updating one OpenClaw install should no longer delete shared runtime dependency roots that another install, profile, or live consumer still needs.

The change landed in [PR #134099](https://github.com/openclaw/openclaw/pull/134099), "fix(postinstall): preserve other installs' runtime dependencies." It was merged at 07:54 UTC on September 4, 2026.

## The Problem

The PR describes an upgrade failure where installing another OpenClaw copy or running Doctor could remove shared runtime dependency caches, mirrors, or valid global aliases. An existing Node process might keep running for a while, then fail later when its next uncached import hit `MODULE_NOT_FOUND`.

That delay made the problem harder to connect to the original install or Doctor action. A separate npm prefix was not enough isolation, because shared home, config, or state paths could still be inherited.

## What Changed

The postinstall cleanup is now package-local. It cleans only the installed package and completes the lifecycle marker, while Doctor no longer owns broad shared-root pruning.

Doctor still repairs genuinely dangling runtime aliases, but it now follows the actual filesystem target with `fs.stat(fullPath)`. The PR calls out why that detail matters: lexical path normalization can erase the meaning of an intermediate directory symlink and misclassify a live target as dead.

The shipped `core/doctor/legacy-plugin-dependencies` lint selector remains informational and default-off. The PR does not add new dependencies, configuration options, SQLite schema changes, migrations, or runtime compatibility readers.

## User Impact

The fix protects:

- Shared dependency roots.
- Versioned caches and mirrors.
- Unknown consumer files.
- Valid aliases used by other installs or profiles.
- Roots selected through `STATE_DIRECTORY` and `OPENCLAW_PLUGIN_STAGE_DIR`.

Installation-local stale artifacts are still removed, so this is not a blanket cleanup disable. It is a tighter ownership boundary: the package owns its own files, and shared caches are not treated as disposable just because an updater can see them.

## Evidence From The PR

The PR reports native update and Doctor proof on macOS with Node 26.8.1 and npm 12.0.2. A real installed `openclaw@2026.4.29` CLI updated to a target tarball, then ran `doctor --fix --non-interactive` twice. Negative controls using the released `openclaw@2026.8.1` reproduced shared-root deletion, while the fixed candidate preserved readers, aliases, tokens, SQLite handles, and database hashes across all tested phases.

The merged commit is `f584661fac60ce193c4c735966e353f6a773c89d`. For operators with multiple OpenClaw installs, profiles, or staged plugin directories on the same machine, this is a quiet but important hardening of update safety.

