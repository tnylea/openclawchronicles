---
title: "OpenClaw Doctor Gets Safer Session Restore"
excerpt: "OpenClaw PR #117221 hardens session SQLite restore so Doctor chooses valid archives carefully and fails closed on risky duplicates."
coverImage: '/assets/images/posts/openclaw-2026-8-1-session-sqlite-restore-fix.png'
date: '2026-08-01T08:06:00.000Z'
dateFormatted: August 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-1-session-sqlite-restore-fix.png'
---

OpenClaw merged [PR #117221, "fix(doctor): session SQLite restore installs an empty session index over the valid archive"](https://github.com/openclaw/openclaw/pull/117221), a P1 repair for `openclaw doctor --session-sqlite restore`.

The bug was subtle and serious. When several migration runs archived the same destination, Doctor could choose a later recreated empty `sessions.json` instead of the original pre-migration session index. In the worst case, a restore command could report success while installing the wrong archive.

That is exactly where repair tooling has to be conservative. A doctor command should make recovery easier, but it also needs to avoid turning ambiguous archive history into data loss.

## The Root Cause

The PR describes the old restore path as processing manifests immediately. That meant filesystem order quietly became the data-selection policy.

An earlier change reversed some ordering, but still inferred that a missing losing archive had already been consumed by a previous restore. If the original archive had actually been deleted or lost, Doctor could still install a later empty index and treat the restore as complete.

The invariant now belongs to the session-SQLite migration-run owner: all archives targeting one destination must be evaluated before anything is moved.

## What The Repair Does

The rewritten restore path plans duplicate destinations before it writes. That gives Doctor a chance to compare archive candidates, preserve losing archives, and reject ambiguous or unsafe combinations.

The PR lists several new behaviors:

- Identical archives can select the earliest recorded copy.
- One valid nonempty legacy session index can supersede valid empty-object copies from older writers.
- Distinct nonempty indexes, distinct transcript archives, invalid archives, unsafe archives, and missing archives without consumption evidence fail closed before rename.
- Losing archives remain untouched.
- Successful renames record exact consumed archive paths in additive provenance.
- Older shipped manifests can be upgraded when one restored source maps unambiguously to one archive.
- Transcript-like archives are fingerprinted in bounded chunks instead of loaded synchronously as whole files.

No runtime session schema change is required. The PR says session storage remains SQLite-only, while restore provenance gets enough extra evidence to make repeated repairs predictable.

## Why Operators Should Care

This is a recovery-path fix, so most users will never see it during a normal day. But when someone does need `openclaw doctor --session-sqlite restore`, the stakes are high. Session indexes and transcripts are the operator's record of work.

The improved policy prefers the valid original archive when it can prove the relationship. When it cannot prove the relationship, it leaves destinations absent, preserves archives, and reports conflicts instead of quietly picking the wrong file.

That is the right bias for repair tooling. Recovery should be explicit about uncertainty.

## Verification

The PR includes destructive fixtures using the real import and restore entry points, not hand-written result objects. The covered cases include a nonempty original index plus later empty indexes, two distinct nonempty indexes, deleted original archives, malformed originals, repeated restore and re-import cycles, and duplicate 4 MiB transcript archives.

The author reports 83 passing focused Doctor tests, adjacent startup and maintenance tests, a remote SQLite flip lifecycle E2E, and a clean autoreview on the exact local head.

For OpenClaw operators carrying state across beta migrations, PR #117221 is a meaningful trust improvement. Doctor now has a clearer rulebook for restoring session archives without flattening important history.
