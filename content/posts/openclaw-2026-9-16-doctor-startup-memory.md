---
title: "OpenClaw Cuts Doctor Startup Memory"
excerpt: "OpenClaw PR #149704 stops Doctor, update, and Gateway startup from reading unrelated transcripts in large stores."
coverImage: '/assets/images/posts/openclaw-2026-9-16-doctor-startup-memory.png'
date: '2026-09-16T08:02:00.000Z'
dateFormatted: September 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-16-doctor-startup-memory.png'
---

OpenClaw merged [PR #149704](https://github.com/openclaw/openclaw/pull/149704), a P1 Gateway fix aimed at a painful failure mode for large installations: `openclaw doctor --fix`, `openclaw update`, and Gateway startup could exhaust memory while preparing a retired main-agent migration, even when there were no legacy sessions to migrate.

The PR describes a private team-sized 17.5 GB database copy with zero legacy rows where Doctor exhausted a 16 GB V8 heap after 785 seconds. The important detail is that the migration was materializing unrelated owner transcripts before checking whether any legacy alias actually needed them.

## What Changed

The migration now checks for legacy session aliases before reading transcript bodies. If there are no legacy aliases, Doctor and startup can skip transcript reads entirely. If aliases do exist, OpenClaw streams only the aliases and canonical targets that matter.

That shifts the memory shape from all owner transcripts to the much smaller set of legacy-targeted transcripts. The PR keeps the existing arming, ownership, schema, ledger, warning, and quarantine behavior.

The repair also tightens the copy and cleanup path:

- Session keys are enumerated once across candidate stores.
- Transcript bodies are streamed one row at a time.
- Copy staging rereads and validates the source before the destination transaction.
- Source deletion revalidates the digest inside the existing transaction.
- Completed ledgers keep their current skip behavior unless Doctor is explicitly rescanning.

## Why It Matters

Doctor is supposed to be the tool you trust when the system is unhealthy. If Doctor or update can run out of memory while proving there is nothing to migrate, large teams are left with a rough operational loop: the safety check itself becomes the bottleneck.

This fix is especially relevant for long-lived OpenClaw installs where session stores can grow large over time. A migration that needs only a few historical aliases should not pay the cost of every unrelated transcript.

The practical result is quieter maintenance for operators with big databases. OpenClaw still preserves the old migration rules, but it now avoids loading work it can prove is irrelevant.

## The Proof

The PR reports a focused regression for the zero-legacy case and additional coverage for cross-store aliases, unreadable paths, deletion guards, and digest validation. It also states that retained migration state now contains keys, entries, and digests rather than transcript bodies.

No new configuration or persistent storage is added. The production change is described as a 60-line increase to preserve cross-store discovery and transactional cleanup while removing the retained transcript payloads.

## What To Watch

This is a targeted infrastructure fix, not a new user-facing command. The most visible effect should be fewer memory failures during Doctor, update, and Gateway startup on large installations.

For anyone running a team deployment, PR #149704 is one of those unglamorous changes that matters a lot: the repair path gets closer to doing only the work the database actually requires.
