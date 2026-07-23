---
title: "OpenClaw Moves Heartbeat Context Into SQLite"
excerpt: "OpenClaw now stores heartbeat scratch in cron-owned SQLite state, replacing workspace HEARTBEAT.md files with revision-safe context."
coverImage: '/assets/images/posts/openclaw-2026-7-23-heartbeat-scratch-sqlite.png'
date: '2026-07-23T23:01:00.000Z'
dateFormatted: July 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-23-heartbeat-scratch-sqlite.png'
---

OpenClaw continued its automation unification work with [PR #112967](https://github.com/openclaw/openclaw/pull/112967), moving heartbeat context out of workspace `HEARTBEAT.md` files and into cron-owned SQLite state.

This follows the recent shift that made heartbeat cadence a system-owned cron monitor job. The remaining mismatch was context: the monitor still depended on a file in the agent workspace that the runtime re-read on every tick. That file did not have revision safety, did not live in the storage layer OpenClaw wants for automation state, and could not cleanly belong to the monitor job itself.

## What Replaces HEARTBEAT.md

The patch adds a `cron_job_scratch` table in the shared state database. It is additive, does not bump the schema version, and is declared in the canonical schema with idempotent ensure logic.

Each heartbeat monitor can now own a private scratch value with:

- A 256 KiB content cap
- Compare-and-swap revisions
- Monotonic lineage across unset and recreate operations
- A content-null tombstone so stale writers cannot resurrect old scratch
- A single preflight SQLite query that resolves the monitor job and scratch together

The old steady-state file reads are removed. The workspace path hint and bootstrap-file injection paths are deleted too, which means new setups no longer seed heartbeat context as a loose workspace file.

## Agent Self-Editing

The heartbeat response surface gains an optional `scratch` parameter. An agent can use it to atomically replace the monitor scratch for future heartbeat runs. The returned tool output only reports whether scratch changed and how large it is; the scratch content itself is not echoed back into model-visible output.

That is a small but important privacy detail. Heartbeat scratch can contain checklists, reminder context, or routing notes. The PR keeps that context attached to the cron job without spraying it into ordinary reply payloads or channel-visible results.

## Doctor Migration

Existing setups are handled by `openclaw doctor --fix`. Doctor imports each enrolled agent's `HEARTBEAT.md` into the monitor scratch, records SHA-256 provenance, verifies the write, archives the original under the state backup directory, and removes the file.

The migration refuses unsafe inputs such as symlinks escaping the workspace, hard links, non-UTF-8 files, and files larger than 256 KiB. It is also idempotent and will not overwrite scratch an operator has already edited.

For operators, that means the transition is not simply "delete a file and hope." It is a managed migration with provenance and refusal modes.

## Operator Controls

OpenClaw adds admin-only Gateway RPCs, `cron.scratch.get` and `cron.scratch.set`, and a CLI surface:

```bash
openclaw cron scratch <jobId> --set "..."
openclaw cron scratch <jobId> --file HEARTBEAT.md
openclaw cron scratch <jobId> --unset
```

The command supports expected revisions, giving operators a safe way to update scratch without clobbering concurrent changes.

## Why This Matters

Heartbeat behavior is part of OpenClaw's personality layer, but it is also infrastructure. When heartbeat checks become cron monitor jobs, the monitor should own its own durable context. Keeping that context in the database gives OpenClaw a clearer boundary for disabled monitors, job removal, future reconciliation, and automation state audits.

The PR reports 65 focused heartbeat and scratch tests, doctor migration coverage, cron CLI and Gateway validation, prompt snapshot updates, a green build, formatting and lint checks, and a Codex autoreview round that found and drove fixes for revision ABA, provenance exposure, and stale prompt guidance.

This is the sort of change that makes automation less magical and more inspectable. Heartbeats still feel lightweight from the chat side, but their backing state now behaves like first-class cron data.
