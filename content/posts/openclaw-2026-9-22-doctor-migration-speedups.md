---
title: "OpenClaw Doctor Speeds Up Large Migrations"
excerpt: "OpenClaw PR #155460 makes Doctor and update rehearsals spend less time migrating large SQLite conversation stores."
coverImage: '/assets/images/posts/openclaw-2026-9-22-doctor-migration-speedups.png'
date: '2026-09-22T08:02:00.000Z'
dateFormatted: September 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-22-doctor-migration-speedups.png'
---

OpenClaw merged [PR #155460](https://github.com/openclaw/openclaw/pull/155460), a performance-focused update to Doctor and updater migration work on large SQLite stores.

The problem was avoidable overhead during update rehearsals and Doctor migrations. On large conversation stores, small page caches and repeated parsing of the same transcript JSON could add real time to preparation and migration paths.

## What Changed

The PR gives private migration and repair connections a 64 MiB SQLite page-cache allowance. That allowance ends when the connection closes, and serving connections keep their existing policy. In other words, OpenClaw gives the temporary maintenance path more room to work without changing the ordinary serving database behavior.

The change also builds transcript navigation metadata from one materialized JSONB input when the SQLite library supports it. The original text is still retained for validity and reset behavior, and older supported SQLite libraries keep the text path.

Doctor media migration, agent maintenance, and shared-state repair handles now share the existing disposable integrity-worker cache policy. Shared repair configures the cache after recognized catalog repair, so malformed legacy indexes remain recoverable.

## User Impact

For users, this should mean updates and Doctor spend less time preparing and migrating stored conversations. The PR is careful about boundaries: transcript bytes, schema, journaling, durability, integrity checks, maintenance authority, and rollback rules are unchanged.

That makes this a useful kind of performance improvement. It targets internal maintenance cost while explicitly preserving the data and recovery semantics that matter during an update.

These improvements run in the candidate Doctor, including when a published updater invokes it. The PR does not add a new driver marker and does not enlarge older updater deadlines.

## Measured Results

The PR includes several measurements. A synthetic schema 22 to 23 migration with 100,000 events across 5,000 interleaved sessions and a 466 MB store measured 17.5% to 19.6% less time when changing only the page-cache allowance.

Interleaved comparisons over 21 varied synthetic payloads, covering 2,100 preparations per pass, measured 23% to 25% less total payload-preparation time and 33% to 34% less navigation SQL time. The prepared fields matched exactly, including compressed bytes and navigation text.

The actual `migrateLegacyMediaPersistence` entry point also completed on the same 466 MB fixture. Candidate runs varied under host load, but preserved the same streamed hash of 100,000 row identities, timestamps, and original payload bytes, reached schema 23, and returned no warnings.

Validation included transcript, schema-migration, historical media-migration, maintenance recovery, integrity-worker, schema-inspection-worker, and shared-state tests. Package acceptance also upgraded the published `openclaw@2026.9.5` through its own updater to the candidate and passed automatic migration, survival, Doctor, Gateway probe, and status phases.

For large OpenClaw installations, PR #155460 is a welcome maintenance-path cleanup: same data guarantees, less repeated work.
