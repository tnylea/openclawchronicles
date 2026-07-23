---
title: "OpenClaw Lands Session Schema v14"
excerpt: "OpenClaw merged a v14 per-agent session database schema, tightening lifecycle ownership while preserving existing session behavior."
coverImage: '/assets/images/posts/openclaw-2026-7-23-session-schema-v14.png'
date: '2026-07-23T23:00:00.000Z'
dateFormatted: July 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-23-session-schema-v14.png'
---

OpenClaw merged a major internal state change in [PR #113071](https://github.com/openclaw/openclaw/pull/113071), restructuring the per-agent SQLite database around a new v14 session schema. The change is not a flashy UI feature, but it matters for anyone who depends on long-running agents, session history, child sessions, board tabs, heartbeat outcomes, and transcript retention.

The core problem was ownership. Before this patch, one logical session identity was split across `session_entries`, `session_routes`, and generation rows in `sessions`. That made cleanup, alias canonicalization, transcript retention, and future indexed session listing harder to reason about safely.

## What Changed

The new schema creates a node-owned model for session state. `session_nodes` replaces the older entry and route split, with one row per session key, the current session id, the canonical entry blob, and promoted index columns. `session_windows` replaces the old `sessions` table, keeping generation-scoped transcript state keyed by `session_id` while tying each window back to a node through cascading foreign keys.

The PR also renames `session_transcript_generations` to `transcript_rewrite_watermarks`, which better describes what the table does. Board tabs, heartbeat outcomes, session members, transcript index state, and transcript children now receive node or window foreign keys with the right cascade direction.

Just as important: `entry_json` remains the canonical session record. The promoted SQLite columns are indexes projected through a single write path, not a second competing source of truth.

## Migration Safety

The migration is version-gated and runs under the existing `BEGIN IMMEDIATE` pattern. It disables foreign keys before the transaction, performs pre-mutation integrity checks, handles absent legacy columns, and quarantines terminal failures rather than trying to limp forward with a half-migrated database.

It also handles awkward real-world data:

- Multiple windows for the same session key
- Historical orphaned rows
- Transcript-only roots
- Older `createdBy` rows
- Board, heartbeat, member, and rewrite watermark records
- Existing external `session_id` references

The migration backfills indexed fields from canonical entry JSON, folds old creator data into `createdActor`, and preserves transcript-only roots as placeholder nodes.

## Same-Night Repair

A follow-up, [PR #113151](https://github.com/openclaw/openclaw/pull/113151), fixed an upgrade blocker found on supported Node runtimes. Users upgrading a v13 agent database on Node 22.22.3 or Node 24.15.0 could hit SQLite 3.51.3 rejecting the migration with a missing-column error.

The repair changes the lookup so each legacy window owner is joined inside the scalar query instead of referencing the outer window from `ORDER BY`, which only newer SQLite releases accepted. In practical terms, v13 databases should now open and migrate on every currently supported Node line.

## Why Operators Should Care

This is groundwork for faster and safer session operations. OpenClaw is putting more activity into per-agent databases: child sessions, transcript search, heartbeat state, sharing ACLs, resets, rewinds, and future SQL-backed listing. A clearer ownership model lowers the chance that deleting, resetting, or rehoming a session leaves behind stale rows.

The PR explicitly avoids changing wire contracts or session-list filtering. Users should not need to relearn the product surface. The point is to make the storage layer easier to evolve without introducing drift between what the UI shows and what the database actually owns.

## Proof Notes

The main schema PR reports 59 migration tests, 169-plus accessor and lifecycle tests, 141 gateway/reset tests, spawn and fork suites, history E2E coverage, doctor coverage, sharing and security shards, a full Node 24 build, `check-changed`, and a clean Codex autoreview.

The follow-up repair includes live proof on Node 24.15.0 with SQLite 3.51.3, plus focused migration checks on Node 22.22.3 and Node 24.18.0. That breadth is reassuring because schema migrations are where small SQL assumptions can become startup failures.

For OpenClaw administrators, the headline is simple: session storage just got a new foundation, and the upgrade path received an immediate compatibility fix before it could become a wider support problem.
