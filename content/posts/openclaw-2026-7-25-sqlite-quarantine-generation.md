---
title: "OpenClaw Fixes SQLite Quarantine Drift"
excerpt: "OpenClaw now binds SQLite quarantine state to stable database generations, preventing stale corruption verdicts after repairs, restores, and replacements."
coverImage: '/assets/images/posts/openclaw-2026-7-25-sqlite-quarantine-generation.png'
date: '2026-07-25T08:03:00.000Z'
dateFormatted: July 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-25-sqlite-quarantine-generation.png'
---

OpenClaw merged [PR #113459](https://github.com/openclaw/openclaw/pull/113459), a P1 SQLite reliability fix for a nasty state-management race: a stale background integrity result could quarantine a database that had already been repaired or atomically replaced.

That kind of bug is painful because the system is trying to be conservative. OpenClaw should fail closed when a state database is actually corrupt. But a verifier result from an older file generation should not follow a healthy replacement database and keep it locked out.

The merged change binds quarantine decisions to the specific database generation that was checked.

## The Race

The PR describes a window where OpenClaw could verify one SQLite generation, then apply the result after the file had changed. In practical terms, a repair, restore, checkpoint, or atomic replacement could leave a healthy database in place while an older integrity result still carried enough authority to quarantine it.

SQLite state is central to OpenClaw's session, agent, and runtime behavior. False quarantine is not just noisy diagnostics; it can block healthy recovery after an operator has already fixed or replaced the underlying state.

## What Changed

The verifier now reconfirms against a stable, descriptor-pinned SHA-256 generation that covers the database, WAL, and rollback journal. Both process-local and persisted quarantine state are bound to that generation.

The PR also migrates existing quarantine stores from schema v1 to schema v2 and automatically expires stale generation-bound rows. Worker failures are treated as advisory, the authoritative owner is drained before confirmation, and agent schema trust is revoked whenever confirmation drains pathname ownership.

The important behavior is simple: confirmed corruption still fails closed, but healthy replacement databases are revalidated and reopened normally.

## Why Operators Should Care

State durability work is often invisible until recovery day. This fix improves the path where an operator or automated repair replaces a database and expects OpenClaw to trust the new generation.

Without generation binding, an integrity result could outlive the bytes it actually inspected. With generation binding, OpenClaw's quarantine state follows the database content and sidecars it verified, rather than only the pathname where a database happened to live.

That distinction matters most on busy systems where WAL files, rollback journals, checkpoints, restores, and repairs can happen close together.

## Validation

OpenClaw reports 212 passing SQLite and state-database tests on the exact head, plus `pnpm check:changed` passing in 17 minutes and 31 seconds.

Regression coverage includes unsafe-index drift, same-inode repair, live and closed replacement races, database/WAL/journal generation changes, process-latch expiry, persisted quarantine expiry, schema-v1 migration, hot rollback-journal recovery, and agent schema revalidation after owner drain.

The PR also notes that an earlier metadata-only generation approach failed a same-size committed-write regression. Descriptor-pinned content hashing made that regression pass, which is the right kind of boring: the verifier now keys trust to the bytes that matter.
