---
title: "OpenClaw Repairs Workspace Migration Safety"
excerpt: "OpenClaw now preserves configured workspaces after setup-state migration, preventing false vanished-workspace failures on upgrade."
coverImage: '/assets/images/posts/openclaw-2026-8-17-workspace-migration-repair.png'
date: '2026-08-17T23:03:00.000Z'
dateFormatted: August 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-17-workspace-migration-repair.png'
---

OpenClaw merged a compact but high-impact upgrade repair in [PR #125435](https://github.com/openclaw/openclaw/pull/125435), fixing a workspace survival check after setup-state migration.

The issue affected users upgrading from the latest stable release. They could complete Doctor's JSON-to-SQLite setup-state migration, then see a customized workspace rejected as vanished before the first provider turn. The case was narrow but serious: the workspace could be real and configured, yet the migration path no longer had the old setup-state marker that previously helped prove it.

## What Changed

The fix is intentionally small. The setup-only survival check now uses OpenClaw's existing configured-profile predicate instead of a narrower user-content evidence helper.

That matters because configured workspaces are not always proved by the same files. The PR says the broader predicate keeps memory, skills, and existing evidence signals while also recognizing customized onboarding profile files such as:

- `IDENTITY.md`
- `USER.md`
- related onboarding profiles

Empty or generated-only workspaces still stay protected by the existing disappearance checks. The change does not recreate bootstrap files and does not weaken wiped-workspace detection.

## Why It Matters

Upgrade bugs are uniquely painful because they punish users who are already doing the right thing. A user can run Doctor, accept migration, and still get blocked before reaching a provider turn if the workspace evidence check is too narrow.

For OpenClaw, workspace identity is sensitive. The system should fail closed when a workspace really vanished, but it should not mistake a legitimate configured workspace for a missing one just because setup state moved from JSON into SQLite.

PR #125435 closes that gap. Customized workspaces survive stable-to-current upgrades and can reach the provider normally after Doctor migrates setup state into SQLite.

## Root Cause

The PR traces the root cause to setup state moving into SQLite in an earlier change. The migration removed the retired JSON state marker, but the no-attestation survival path still used a narrower helper for evidence.

That mismatch exposed configured workspaces whose proof lived in onboarding profile files instead of in the older evidence set. After the fix, the setup-only survival check uses the same broader configured-profile predicate that already understands those files.

The production diff is only one line changed, with 15 lines of test coverage added. Small diffs are not automatically low-risk, but this one is anchored to a precise owner-boundary regression.

## Evidence From The PR

The pre-fix regression failed with `WorkspaceVanishedError`. The fixed head passes through bootstrap-enabled `ensureAgentWorkspace()` while preserving customized `IDENTITY.md`.

The PR reports the focused SQLite workspace safety suite passing 8 of 8 tests, with relevant workspace suites reaching 73 passed before the final rebase. It also reports full changed-file gates, formatting, Oxlint, and `git diff --check` passing.

The strongest evidence is the packaged survivor upgrade. A packed OpenClaw build upgraded `openclaw@2026.7.1-2` to a packed `openclaw@2026.8.1` with 4,800 sessions, 23,890 transcript events, 2,200 cron jobs, installed plugins, nested Discord config, and repaired legacy Telegram runtime dependencies. Doctor completed in 22 seconds, the idempotence Doctor run completed in 21 seconds, Gateway startup completed in 15 seconds, and a live OpenAI turn returned the expected marker.

For users, this should make a stable-to-current upgrade less likely to confuse "configured" with "vanished."
