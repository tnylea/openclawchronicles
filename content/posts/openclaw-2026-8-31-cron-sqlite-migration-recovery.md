---
title: "OpenClaw Cron Jobs Get SQLite Migration Repair"
excerpt: "OpenClaw now preserves valid cron, interval, exit, and stream automations during SQLite migration and can recover already quarantined jobs."
coverImage: '/assets/images/posts/openclaw-2026-8-31-cron-sqlite-migration-recovery.png'
date: '2026-08-31T08:01:00.000Z'
dateFormatted: August 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-31-cron-sqlite-migration-recovery.png'
---

OpenClaw merged a high-priority cron repair that protects valid automations during SQLite migration and gives affected operators a recovery path. PR #133858 fixes a case where Doctor could quarantine legitimate jobs when recognized schedule kinds or stream modes used different casing or surrounding whitespace.

That sounds narrow, but the operational impact is real. Cron, interval, exit, and stream jobs are exactly the kind of background automation users expect to keep running across upgrades. A migration that mistakes formatting variation for an invalid schedule can quietly remove useful standing work from the active scheduler.

Official source: [PR #133858](https://github.com/openclaw/openclaw/pull/133858).

## The Bug

The problem lived at the boundary between legacy automation data and strict SQLite validation. Some jobs represented recognized schedule kinds, but not in the canonical casing or spacing that the new migration path expected.

Before the fix, Doctor's migration could quarantine those jobs along with truly invalid schedule records. Re-running Doctor did not restore jobs that had already been moved aside, leaving operators to inspect and repair them manually.

The PR describes the affected cases as recognized `cron`, `every`, and `stream` variants, with an unknown-kind control used to prove that invalid jobs still stay quarantined.

## The Fix

Doctor now canonicalizes recognized schedule enums before strict validation. In explicit repair mode, `openclaw doctor --fix` also revalidates quarantine rows marked `invalid-schedule` and restores only rows that pass current validation.

The key detail is that recovery is conservative. Ordinary startup does not reactivate quarantined jobs, unknown schedule kinds remain quarantined, and restoration plus quarantine deletion happen in one SQLite transaction. That keeps repair explicit and avoids silently resurrecting genuinely unsafe or malformed automation entries.

For users, the expected upgrade path is simple: if a valid automation was affected, run `openclaw doctor --fix`. Jobs that pass validation return with their enabled state and runtime state intact.

## Evidence

The PR includes a red reproduction against the canonical base, where recognized schedule variants were removed alongside an invalid control. The green proof then showed that ordinary startup restored nothing, explicit Doctor restored exactly the three valid jobs in canonical form, the unknown control stayed quarantined, and a repeated repair did not restore duplicates.

Focused regression coverage passed 146 tests across Doctor migration, recovery, startup authority, and SQLite atomicity. Strict smoke builds also passed on both the canonical base and the proposed code.

## Why It Matters

OpenClaw has steadily moved more background behavior into durable, inspectable automation: cron jobs, heartbeats, loops, owner-routed alerts, and TaskFlow-style work. That makes migration correctness part of the trust model.

This fix is a good example of the right repair shape. It does not loosen validation for every odd value. It recognizes valid historical input, converts it to the current canonical form, and gives operators an explicit recovery command for already affected state.

