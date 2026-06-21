---
title: "OpenClaw Plugin Installs Get a Self-Healing Fix"
excerpt: "OpenClaw now reconciles managed npm root overrides with peer pins, helping broken plugin installs recover without manual repair."
coverImage: '/assets/images/posts/openclaw-2026-6-21-plugin-npm-root-self-heal.png'
date: '2026-06-21T23:03:00.000Z'
dateFormatted: June 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-21-plugin-npm-root-self-heal.png'
---

OpenClaw merged a plugin-install reliability fix in [PR #91786](https://github.com/openclaw/openclaw/pull/91786), addressing a managed npm-root failure that could make later `openclaw plugins install` or `openclaw plugins update` commands fail and roll back.

The short version: managed peer dependency pins could become stale while newer workspace overrides expected a different version. npm rejected that mismatch with `EOVERRIDE`, and the managed plugin root was stuck until the manifest was repaired.

## The Failure Mode

OpenClaw 2026.6.5 started exporting the full workspace override set into managed plugin npm roots. One example from the PR is `hono: 4.12.18`.

At the same time, older managed roots could still carry stale peer pins, such as `hono: 4.12.23`, written by a pre-2026.6 install. npm's Arborist rejects a root manifest when an override changes the effective spec of a direct root dependency.

That combination meant a root could have both a direct dependency and an override for the same package, but with conflicting specs. Once in that state, future plugin install or update attempts failed before they could do useful work.

## What Changed

The fix changes managed peer pins so they follow the fresh npm plan instead of preserving whatever spec already exists on disk. The peer plan runs with managed overrides applied and stale managed pins removed, so the generated pins should be override-consistent.

The PR also adds `reconcileManagedNpmRootOverrideConflicts()`, which enforces the npm override invariant whenever OpenClaw writes a managed manifest. That includes:

- Dependency upserts.
- Managed peer dependency sync.
- Quarantine rollback snapshot restore.
- Plan-failure fallback paths that might otherwise reuse stale pins.
- Alias override cases where lock-resolved versions cannot string-match the override.

There is also an ownership rule: explicitly installing a package removes stale managed-peer metadata for that package, so a later peer sync cannot downgrade or delete the version the operator intentionally requested.

## Why It Matters

Plugin systems live or die on predictable upgrades. A confusing npm-root failure is especially painful because it appears during the recovery path operators naturally reach for: install again, update again, try to repair the plugin.

This fix is designed to self-heal affected roots. The next plugin install or update rewrites the manifest before npm runs, so operators should not need a doctor migration or manual package file edit for this specific conflict.

The PR changed only two files but added 527 lines of focused logic and tests. Verification included managed-root unit tests, plugin install/uninstall tests, real npm install E2E coverage, and checks against npm 11 Arborist behavior.

