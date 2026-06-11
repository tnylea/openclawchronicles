---
title: "OpenClaw Memory Sync Gets Faster on Shared Storage"
excerpt: "OpenClaw memory-core now targets dirty session files directly, reducing repeated directory scans for agents running on shared storage."
coverImage: '/assets/images/posts/openclaw-2026-6-11-memory-delta-sync.png'
date: '2026-06-11T08:00:00.000Z'
dateFormatted: June 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-11-memory-delta-sync.png'
---

OpenClaw's memory-core extension picked up a targeted performance fix this morning for deployments that keep session history on shared or networked storage.

The change landed in [PR #91841](https://github.com/openclaw/openclaw/pull/91841), titled "perf(memory): target session delta syncs with the dirty set instead of full directory scans." It changes how session delta syncs decide which files need to be indexed. Instead of repeatedly enumerating the whole sessions directory, OpenClaw now passes the accumulated dirty-file set into the targeted sync path that already existed.

That sounds like a small implementation detail. For operators running agents on NFS or other shared filesystems, it can remove a noisy and expensive background pattern.

## Why Session Delta Syncs Were Expensive

The PR explains that every debounced session delta sync previously called a generic sync path without explicit targets. That made `syncSessionFiles` enumerate the full sessions directory before skipping files that were not dirty.

On local SSDs, that extra listing may be easy to miss. On networked filesystems, it is much more visible. The PR cites an NFSv4.1 profile where full listings of an `agents/main/sessions` directory took roughly 3.4 to 3.8 seconds for about 100 entries, because the client requested broad directory attributes and the backing server had to satisfy them with per-entry metadata reads.

The author notes that the traced scans behind that specific report came from a separate archive-retention path, already fixed in another PR. But the cost model still applies: when memory session sync is enabled, a delta sync should not pay for a full directory scan if OpenClaw already knows which files are dirty.

## What Changed

The new path makes `processSessionDeltaBatch` pass accumulated dirty session files as explicit `sessionFiles` targets. That lets the memory manager skip the sessions-directory enumeration during normal delta syncs.

The targeted behavior is careful about failure and concurrency:

- Files dirtied while a sync is in progress remain dirty.
- Targets stay dirty if the targeted sync fails.
- Boot catch-up, full reindex, forced CLI syncs, and interval syncs still use full enumeration when that is the right behavior.
- A bounded reconciliation scan still happens at most once per 15-minute window so out-of-band file deletion can prune stale index rows.

The important design choice is that OpenClaw does not abandon full scans entirely. It moves them away from the hot path and keeps them for reconciliation points where a full view of the directory is actually useful.

## Better Behavior for Multi-Agent Storage

This is especially relevant for people running OpenClaw across shared storage, remote home directories, containers with mounted volumes, or multi-node setups where session files may live somewhere slower than a laptop disk.

The user-facing win is not a new command or screen. It is less background I/O, fewer repeated directory walks, and more predictable memory indexing under steady activity.

The PR says expected verification on a live shared-filesystem deployment is simple: count `scandir` events on the sessions directory during steady-state activity. Before this fix, memory delta syncs could produce one full scan per roughly five-second batch. After the fix, that should drop to one full reconcile scan per 15-minute window, with targeted syncs handling the normal dirty-file flow.

## Why It Matters

OpenClaw has been moving more state into durable, structured storage over the last several releases. That makes reliability better, but it also puts pressure on background maintenance paths: sync, prune, migrate, compact, and index routines need to stay cheap enough to run all day.

PR #91841 is a good example of that tuning phase. It does not change the memory feature's output. It changes how much filesystem work OpenClaw does to reach the same indexing outcome.

For small single-agent installs, the improvement may be quiet. For larger deployments, shared storage, and long-running agents with active transcripts, it is the kind of fix that keeps the platform from feeling heavier as history grows.

Read the full implementation notes in [OpenClaw PR #91841](https://github.com/openclaw/openclaw/pull/91841).
