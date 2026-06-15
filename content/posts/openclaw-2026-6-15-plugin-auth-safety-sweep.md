---
title: "OpenClaw Tightens Plugin and Auth Safety Paths"
excerpt: "OpenClaw merged plugin install policy, approval persistence, and auth migration fixes that close gaps around trusted installs and credential state tonight."
coverImage: '/assets/images/posts/openclaw-2026-6-15-plugin-auth-safety-sweep.png'
date: '2026-06-15T23:00:00.000Z'
dateFormatted: June 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-15-plugin-auth-safety-sweep.png'
---

OpenClaw's Monday night main branch picked up a quiet but important safety sweep around plugin installation, persistent approvals, and auth profile migration. There was no new release after [v2026.6.8-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.6.8-beta.1), but the merged pull requests are worth tracking before the next release train wraps them.

The center of the story is [PR #93357](https://github.com/openclaw/openclaw/pull/93357), which makes plugin install wrapper flows pass the active OpenClaw config into existing installer policy checks before install side effects happen. That means install paths for `/plugins install`, Git installs, ClawHub installs, npm installs, npm-pack installs, and onboarding helpers all go through the same `security.installPolicy` preflight behavior.

For operators, that is the difference between a policy existing on paper and a policy being consistently enforced at the edges where third-party code enters the system.

## What Changed

The merged plugin and auth fixes cover several separate failure modes.

- [PR #93357](https://github.com/openclaw/openclaw/pull/93357) threads active config through plugin install wrappers so install policy checks run before side effects.
- [PR #88945](https://github.com/openclaw/openclaw/pull/88945) serializes plugin-binding approval saves so overlapping `allow-always` approvals cannot persist stale disk state after the in-memory cache has moved on.
- [PR #93156](https://github.com/openclaw/openclaw/pull/93156) imports legacy default-agent `auth.profiles` credentials into the per-agent SQLite auth store during doctor migration.
- [PR #85316](https://github.com/openclaw/openclaw/pull/85316) keeps alias-compatible auth profile overrides instead of clearing them when a raw provider string differs from the runtime alias.
- [PR #89260](https://github.com/openclaw/openclaw/pull/89260) separates platform-incompatible skills from genuinely missing requirements in `openclaw doctor`.

The approval persistence fix is especially practical. Its PR description says overlapping `allow-always` saves could lose persistent plugin-binding approvals on restart when concurrent writes raced on `~/.openclaw/plugin-binding-approvals.json`. The fix queues disk writes behind the previous approval save while keeping in-memory behavior immediate for callers.

## Why It Matters

OpenClaw's plugin surface has two hard jobs. It needs to make third-party extensions easy to install, and it needs to keep local policy meaningful even when those installs arrive through different UX paths. If the chat command, setup wizard, npm helper, and ClawHub helper do not all carry the same policy context, a user can end up with uneven safety behavior without realizing it.

PR #93357 closes that class of gap by making wrapper flows pass the current config into installer policy checks. The PR also adds regressions around npm, npm-pack, ClawHub, and command install paths, which is the right shape for a policy bug: test every entrance, not just the core installer.

The auth migration fix is a different kind of safety work. [PR #93156](https://github.com/openclaw/openclaw/pull/93156) documents an upgrade path where a default agent could move from 2026.6.1 to 2026.6.6 with an empty per-agent SQLite auth store because legacy credentials lived under global `openclaw.json auth.profiles`. Runtime auth then correctly read the canonical SQLite store and found nothing. Doctor now imports that legacy source, strips migrated credential fields back to metadata-only config entries, and avoids repeating the import.

That keeps secrets from lingering in config while preserving the provider credentials users expected to survive the upgrade.

## Operator Takeaway

This is not a flashy feature drop. It is boundary tightening. Plugin installs should honor configured policy before they touch the system, persistent approvals should survive concurrent saves, doctor should distinguish broken skills from platform-mismatched ones, and auth migrations should preserve credentials without keeping secret material in old config fields.

Those are the boring guarantees that make OpenClaw safer to run for more than experiments. Watch the next release notes for this cluster, especially if you rely on ClawHub installs, npm-backed plugins, persistent approvals, or upgraded auth profiles.

Read the source PRs on GitHub: [#93357](https://github.com/openclaw/openclaw/pull/93357), [#88945](https://github.com/openclaw/openclaw/pull/88945), [#93156](https://github.com/openclaw/openclaw/pull/93156), [#85316](https://github.com/openclaw/openclaw/pull/85316), and [#89260](https://github.com/openclaw/openclaw/pull/89260).
