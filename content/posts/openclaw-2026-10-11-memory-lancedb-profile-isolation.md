---
title: "OpenClaw Isolates Memory LanceDB Profiles"
excerpt: "OpenClaw PR #168944 moves the default Memory LanceDB store under the active state directory for named profiles."
coverImage: '/assets/images/posts/openclaw-2026-10-11-memory-lancedb-profile-isolation.png'
date: '2026-10-11T08:03:00.000Z'
dateFormatted: October 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-11-memory-lancedb-profile-isolation.png'
---

OpenClaw merged [PR #168944](https://github.com/openclaw/openclaw/pull/168944), a Memory LanceDB fix that changes where the plugin puts its default long-term memory store for named profiles and isolated state directories.

Before this patch, `memory-lancedb` resolved its default database path from the user's home directory at module load. That meant a named profile, custom `OPENCLAW_STATE_DIR`, relocated `OPENCLAW_HOME`, or isolated proof run could still read and write the real `~/.openclaw/memory/lancedb` store unless the user explicitly set `dbPath`.

## What Changed

The default LanceDB path now resolves at config-parse time through OpenClaw's documented `openclaw/plugin-sdk/state-paths` helper. Without an explicit `dbPath`, the store lives at:

- Default profile: `~/.openclaw/memory/lancedb`, unchanged.
- Named profile: that profile's active state directory under `memory/lancedb`.
- Custom state directory: `<stateDir>/memory/lancedb`.

The Doctor contract now uses the same helper with the host-supplied state directory, so Doctor does not accidentally target the home store from an isolated state root.

Explicit `dbPath` values behave as before. No LanceDB row format, schema, migration marker, or storage file is changed.

## Why It Matters

Profiles are supposed to isolate state. A named profile used for testing, proof work, customer reproduction, or a separate agent persona should not silently share the default profile's long-term memory database.

The maintainer decision here is intentionally conservative: isolate, do not migrate. Existing memories remain where they were written. For the default profile, that means nothing moves. For named profiles that previously leaked into the shared home store, the new isolated store starts empty unless the operator deliberately points `dbPath` back to the old shared location.

That avoids copying default-profile memories into every profile on startup, which would preserve the very leak the PR is trying to remove.

## Proof From The PR

The regression tests cover both configuration and Doctor behavior. `config.test.ts` verifies that the default path respects `OPENCLAW_STATE_DIR` even when it is set after module import, while preserving explicit `dbPath`. `doctor-contract-api.test.ts` verifies that migration detection uses the migration state directory instead of `HOME`.

The PR also ran memory-lancedb startup/import and plugin doctor-contract suites, extension typechecks, lint, formatting, and diff checks.

The real CLI proof is especially useful. Before the fix, `ltm list` under a scratch state configuration registered the plugin against `<HOME>/.openclaw/memory/lancedb` and created that directory. After the fix, the rebuilt runtime registered the plugin against `<scratch>/memory/lancedb` and did not create the home store.

Compatibility checks seeded two memories into the old default store. The candidate still listed both memories under the default profile, showed zero memories under an isolated profile, and allowed a separate profile to opt back into the shared store with an explicit `dbPath`.

## Bottom Line

PR #168944 closes a memory-isolation gap in OpenClaw's LanceDB plugin. Default users keep their existing memory path, while named profiles and custom state directories stop borrowing the home profile's long-term memory by accident.
