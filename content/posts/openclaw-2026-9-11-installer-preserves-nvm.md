---
title: "OpenClaw Installer Now Preserves Existing nvm"
excerpt: "OpenClaw now preserves existing nvm and Node.js setups during installation, avoiding broken npm prefixes, shell-profile edits, and surprise runtime changes."
coverImage: '/assets/images/posts/openclaw-2026-9-11-installer-preserves-nvm.png'
date: '2026-09-11T23:01:00.000Z'
dateFormatted: September 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-11-installer-preserves-nvm.png'
---

OpenClaw’s website installer has a safer path for machines that already use nvm.

[PR #145317](https://github.com/openclaw/openclaw/pull/145317), titled `fix(install): never replace or break an existing nvm during installation`, merged on September 11th at 22:36 UTC. It fixes a P0 installer failure where an existing nvm setup could be disrupted during installation.

The reported case was specific but painful. A user had `nvm use system` selecting Node 26.8.2 while an older nvm default still pointed at Node 24.14.1. The installer activated that older default, ran NodeSource, changed shell profiles, and wrote an npm `prefix` setting that later made `nvm use` fail.

That is exactly the kind of installer bug that leaves a working development machine feeling rearranged after a tool install.

## What Changed

The installer now loads nvm with `--no-use`, which lets it inspect nvm without switching the active runtime. It keeps a compatible active Node.js runtime when one already exists, searches installed nvm versions and other local runtimes before provisioning, and avoids executing arbitrary startup files while trying to discover nvm.

The important policy change is that an existing nvm installation blocks automatic system Node provisioning and persistent npm-prefix edits. If OpenClaw needs a runtime that is not already available, the installer can use a supported nvm version or ask before installing one through nvm.

For non-interactive installs, the new behavior is intentionally conservative. Instead of mutating the system, OpenClaw prints the exact command needed and stops.

## User Impact

For users, the repair protects three things that should feel personal on a development box: installed nvm versions, system Node binaries, and npm settings.

The expected behavior now is:

- Existing nvm aliases and defaults are preserved.
- Shell profile files are not rewritten just because nvm exists.
- npm `prefix` settings are not changed in ways that break nvm.
- A compatible runtime can be selected for installation without becoming the new default.
- New nvm Node installation requires explicit consent.
- Homebrew Node selection on macOS gets the same safer runtime-selection treatment.

The PR notes one practical limitation. If a custom or lazy shell hook is the only way to identify nvm, users need to load nvm in their shell and rerun the installer. OpenClaw does not execute arbitrary shell startup files to locate it.

## Validation

The PR reports targeted installer regressions that failed before the repair and passed afterward. Fourteen nvm preservation tests now pass, and the full installer suite passes 220 tests.

The author also reports shell syntax checks, ShellCheck, formatting, root-test typechecking, targeted lint, changed-file checks, and green main CI on the candidate head. Website Installer Sync verification passed across Debian, Linux Docker, Fedora, macOS, and Windows jobs.

The real-world proof is unusually concrete. On Debian trixie, using a normal user with nvm 0.40.3, nvm Node 24.14.1, and system Node 26.8.2, the original installer changed the effective system selection and left an incompatible npm prefix. The candidate preserved the original rc files, npm config, nvm aliases, nvm files, and system Node checksum.

Mac proof used Homebrew Node 26.8.2 and nvm Node 24.14.1 in an isolated home. The candidate kept `/opt/homebrew/bin/node` selected without changing rc or default files.

## Why It Matters

Installers need to be boring in the best possible sense. OpenClaw can ask for a runtime, but it should not quietly rewrite the user’s Node environment when a compatible one already exists.

This change makes the installer more respectful of existing development setups. It also narrows future debugging: if provisioning is needed, OpenClaw now either uses a known supported path or stops with clear instructions instead of leaving nvm half-broken.

There is one release-ops follow-up. After merge, the website installer sync still needs to propagate `scripts/install.sh` to the public `openclaw.ai` installer before users should treat the fix as deployed from the website path.
