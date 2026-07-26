---
title: "OpenClaw Replaces Shrinkwrap for npm 12"
excerpt: "OpenClaw removed npm shrinkwrap files and now mirrors pnpm locks into transient package locks for npm 12-compatible installs and plugin publishing flows."
coverImage: '/assets/images/posts/openclaw-2026-7-26-npm12-dependency-locking.png'
date: '2026-07-26T08:02:00.000Z'
dateFormatted: July 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-26-npm12-dependency-locking.png'
---

OpenClaw has removed its committed npm shrinkwrap files and moved to a pnpm-first dependency locking model that remains compatible with npm 12. The change landed in [PR #114006](https://github.com/openclaw/openclaw/pull/114006), a broad P1 dependency and security-boundary update spanning install, plugin publish, validation, and documentation paths.

The trigger was upstream: npm 12 removed shrinkwrap support. The `npm shrinkwrap` command is gone, and `npm-shrinkwrap.json` is no longer loaded from project roots or dependency tarballs.

## Why Shrinkwrap Had To Go

OpenClaw depended on shrinkwrap in several places. The PR says npm 12 broke the local `pnpm deps:shrinkwrap:*` generator command, made plugin publish flow captive to npm 11 assumptions, and silently stopped honoring the shipped shrinkwrap pinning contract for users installing with npm 12.

That is a messy failure mode for an agent platform, because dependency boundaries are not just build metadata. They are part of the supply-chain story for plugins, bundled runtime files, and self-update behavior.

## The New Locking Model

The committed review boundary is now `pnpm-lock.yaml`. Instead of generating and committing `npm-shrinkwrap.json`, OpenClaw keeps a script that mirrors pnpm lock policy into npm's `package-lock.json` format on demand.

That generated package lock is transient. Plugin bundling can write it, run `npm ci`, and produce the expected bundled runtime dependency payload without committing npm-format lockfiles or publishing shrinkwrap files.

The PR deletes 82 committed `npm-shrinkwrap.json` files and replaces the old `deps:shrinkwrap:*` scripts with `deps:npm-lock:check` and `deps:npm-lock:check:changed`.

## Compatibility Boundaries

The migration includes two explicit transition rules.

First, the `2026.7.2` beta train is treated as a bridge: already published `2026.7.2-beta.1` through `2026.7.2-beta.4` packages may still contain shrinkwrap and validate with a warning. Versions after that train hard-require lockless tarballs.

Second, OpenClaw no longer uses shipped shrinkwrap as the signal for classifying npm global installs during self-update. It now detects install topology, including pnpm virtual store and Bun global roots, before falling back to npm.

## User Impact

Installs and plugin installs should continue working across npm 10, 11, and 12. The root package and seven native-heavy opt-out plugins resolve transitive dependencies at install time from exact-pinned direct dependencies, while published plugin packages keep bundling runtime dependency files by default.

Docs also move from `/gateway/security/shrinkwrap` to `/gateway/security/dependency-locking`, with a redirect in place.

The PR reports validation across generator tests, package-manager detection, tarball validation, release checks, managed npm install, dependency guards, ClawHub workflow tests, docs MDX, and 6,193 docs links with zero broken links. The diff is large, but the direction is clean: one committed pnpm lock boundary, transient npm locks only where npm needs them, and no future dependency on removed npm shrinkwrap behavior.
