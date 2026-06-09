---
title: "OpenClaw 2026.6.5 Is Stable: SQLite State Migration Complete"
excerpt: "OpenClaw 2026.6.5 graduates to stable today, completing a sweeping SQLite state migration and shipping transcript image redaction as a security fix."
coverImage: '/assets/images/posts/openclaw-2026-6-9-v2026-6-5-stable.png'
date: '2026-06-09T23:00:00.000Z'
dateFormatted: June 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-9-v2026-6-5-stable.png'
---

OpenClaw `2026.6.5` graduated to stable today at 18:13 UTC, capping a beta series that started June 5th with Parallel search and finished with one of the most comprehensive state-durability overhauls in the project's history. If you've been on any of the betas, upgrade now — the stable adds several fixes that didn't make earlier pre-releases.

## A New Version Number Format

This release also formalizes a new versioning scheme: **YYYY.M.PATCH** monthly patch numbering, replacing the old YYYY.M.D format. The June 2026 floor is pinned at `2026.6.5`. Upgrade paths and compatibility checks remain unchanged — only the tag format shifts.

## The SQLite State Migration Is Complete

The biggest structural change in 2026.6.5 stable is completing the migration of all runtime state from ad hoc flat files to SQLite-owned storage. Six additional components land in this stable that weren't in earlier betas:

- **Matrix sync and crypto sidecars** ([#91100](https://github.com/openclaw/openclaw/pull/91100))
- **Memory-wiki import and source-sync state** ([#91108](https://github.com/openclaw/openclaw/pull/91108))
- **Sandbox registry state** ([#91056](https://github.com/openclaw/openclaw/pull/91056))
- **ACPX process state**
- **Device-pair notify state**
- **Zalo hosted media and plugin SDK dedupe state**

This follows the earlier migration of auth profiles, cron stores, and session metadata. The practical upshot: Gateway restarts no longer scatter state across temporary files, upgrade paths are cleaner, and there are fewer race conditions on concurrent writes. If you run OpenClaw under Docker with frequent restarts, you'll feel this.

## Transcript Image Redaction — a Security Fix

A new security fix in stable catches inline image payloads before they reach stored or exported transcripts ([#91529](https://github.com/openclaw/openclaw/pull/91529)):

> "Inline image payload redaction now catches data URLs and repaired transcript images before they can leak raw image bytes into stored or exported transcripts."

This matters for deployments where transcript exports are shared or logged externally — data-URL-embedded images in agent turns were previously passed through verbatim. The fix applies at the transcript write path, so existing transcripts aren't retroactively redacted, but all new turns are covered.

## config.patch Array Replacement Semantics Fixed

A subtle but potentially breaking bug in `config.patch` was corrected ([#91551](https://github.com/openclaw/openclaw/pull/91551)): arrays without merge keys were being merged instead of replaced, which could silently accumulate stale entries across patch applications. The fix preserves explicit array replacement semantics — if your patch replaces an array, it now replaces it instead of merging in old values.

If you use `config.patch` for array-valued config fields (like `skills.entries`, `agents`, or `providers`), verify your patches behave as expected after upgrading.

## Google Chat Gets Native Approval Cards

Google Chat approvals now use platform-native card actions and click handlers instead of falling back to generic message flow. This brings Google Chat in line with Slack and Discord for the exec-approval experience — operators see a structured card with approve/deny actions rather than free-text messages.

## Android and iOS Polish

- **Android** provider and model screens now surface expiring, unavailable, unresolved, and attention states more clearly, and a new theme mode selector lands in settings
- **iOS** settings and Talk tabs keep diagnostics, gateway rows, attachment labels, fallback copy, and unavailable Talk controls accessible across the new layout changes ([#90752](https://github.com/openclaw/openclaw/pull/90752), [#91201](https://github.com/openclaw/openclaw/pull/91201))

## Agent and Tool Loop Hardening

A cluster of agent/tool safety improvements rounds out the stable:

- MCP lease release no longer refreshes `lastUsedAt` — leases no longer self-extend through use
- Prompt-cache tool names are guarded against collision
- Unreadable dynamic tools are quarantined rather than failing silently
- Background-session name derivation avoids a regex backtracking risk ([#91233](https://github.com/openclaw/openclaw/pull/91233))
- Owner-only HTTP tools are now properly gated at the Gateway level ([#90261](https://github.com/openclaw/openclaw/pull/90261))

## How to Upgrade

```bash
npm install -g openclaw@latest
```

Full release notes and verification hashes are on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.6.5). The session-metadata SQLite migration is explicitly deferred to the next release train — the existing JSON-backed path remains in place while that migration risk is worked on `main`.
