---
title: "OpenClaw Updates fs-safe for Safer Temp Workspaces"
excerpt: "OpenClaw PR #159327 pins fs-safe 0.21.0 and routes Linux temp-workspace callers through private user-owned roots."
coverImage: '/assets/images/posts/openclaw-2026-9-27-fs-safe-temp-workspaces.png'
date: '2026-09-27T08:02:00.000Z'
dateFormatted: September 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-27-fs-safe-temp-workspaces.png'
---

OpenClaw merged a dependency and compatibility update this morning that hardens temporary workspace handling on Linux. [PR #159327](https://github.com/openclaw/openclaw/pull/159327), titled `chore(deps): update fs-safe to 0.21.0`, pins OpenClaw's core and direct extension dependencies to `fs-safe` 0.21.0 and updates production call sites that were still passing shared temp roots directly.

The practical issue is simple: shared system temp directories such as `/tmp` can be group- or world-writable. The newer `fs-safe` release rejects workspace roots that are not owned by the effective user or that are too broadly writable. OpenClaw needed the approved release without breaking backup, plugin installation, Claws packaging, marketplace downloads, or related cleanup flows.

## What Changed

The PR updates core plus 13 direct extension dependencies to exact `0.21.0` pins, regenerates the pnpm lock, and replaces release-age exceptions for the exact wrapper and platform packages.

More importantly, nine production call sites that passed `os.tmpdir()` directly now use OpenClaw's existing secure-root resolver. The PR identifies that resolver as `resolvePreferredOpenClawTmpDir()`, which admits a private OpenClaw root or a user-scoped fallback.

The changed areas include:

- Git backup, restore, and verification workspace handling
- npm policy staging and repair cache paths
- Marketplace downloads
- Claw artifact extraction
- Development staging
- Plugin probes
- Voice-call cleanup fixtures

Existing cleanup still stays with `fs-safe`; the key change is which root OpenClaw offers to it.

## Compatibility Notes

The merge notes are careful about compatibility. Existing backup, plugin installation, and Claws packaging workflows should continue creating and cleaning up private temporary workspaces even when the machine exposes a shared `/tmp`.

Plugin code that supplies a shared root through the temp-workspace SDK now has a stronger expectation: it should provide a private per-user root instead. Maintained OpenClaw callers were updated to follow that rule through the secure-root resolver.

The PR also states there is no stored-data migration. Matrix and memory-core edits are dependency pins only, with no schema, embedding, serialized-field, persistence-format, migration, or key changes.

## Evidence From The PR

The final CI run passed with 174 successful jobs and no failures. The PR also reports wrapper and native platform packages published at 0.21.0 with matching integrity hashes, plus dependency pin checks, structural lock comparison, and a broad TypeScript/governance pass across core, UI, extension, script, and test lanes.

One important regression forces a synthetic `01777` system temp root. Restoring the old production call reproduces an insecure-permissions failure before extraction, while the updated path passes through a private root.

## The Bottom Line

This is a security-adjacent dependency update with practical Linux compatibility work attached. OpenClaw gets the stricter `fs-safe` root checks while preserving the workflows that rely on temporary workspaces every day.
