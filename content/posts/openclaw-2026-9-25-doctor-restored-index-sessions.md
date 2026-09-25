---
title: "OpenClaw Doctor Preserves Restored Sessions"
excerpt: "OpenClaw Doctor now preserves newer SQLite session metadata when restored legacy indexes are replayed during imports."
coverImage: '/assets/images/posts/openclaw-2026-9-25-doctor-restored-index-sessions.png'
date: '2026-09-25T08:01:00.000Z'
dateFormatted: September 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-25-doctor-restored-index-sessions.png'
---

OpenClaw merged a P1 Doctor repair this morning that closes a sharp edge in legacy session recovery. [PR #157615](https://github.com/openclaw/openclaw/pull/157615), titled "fix(doctor): preserve current sessions after restored-index replay," focuses on what happens after legacy sessions have already been imported, their original index is restored, and an import runs again.

The problem was not transcript loss in the simple sense. The PR says a replay could erase newer SQLite labels, pinned or activity timestamps, and current session metadata by replacing them with older restored values. That is exactly the kind of recovery bug that feels quiet until an operator notices a session list has moved backward in time.

## What Changed

The merged fix makes Doctor preserve current SQLite metadata when replaying an unchanged, recorded restored index while it reconciles transcript history. Fresh indexes still follow the normal import path, but replay now has to prove it is acting on the right evidence before it can replace existing state.

The PR describes several guardrails:

- Restored artifacts are identified through the existing recovery inventory.
- Doctor refreshes that inventory after interrupted publication reconciliation.
- Source and receipt identity are validated again after staging.
- Replay requires a receipt for the selected agent and SQLite target.
- Contradictory restore evidence refuses before replacing current state.

That is a lot of machinery, but the operator-facing idea is simple: recovery should add or reconcile history, not overwrite newer session metadata with stale restored records.

## Why This Matters

OpenClaw keeps moving more operational state into SQLite-backed stores. That gives the system stronger ownership and transactional behavior, but it also raises the bar for recovery tooling. Doctor is often the command users reach for when something has already gone wrong, so it needs to be conservative when evidence is incomplete.

The most important line in this change is the refusal behavior. When recovery history is unreadable, Doctor can still import into an empty destination. If existing session rows could be replaced, it refuses instead of guessing.

That is the right default. A failed repair that stops with a clear refusal is much easier to reason about than a repair that silently rolls current state back.

## Evidence And Limits

The PR includes extensive proof, including real SQLite reproductions where the original code erased newer metadata while transcript history survived. The repaired boundary preserves state or refuses unsafe cases, and focused Doctor/import test groups covered restored-index replay, shared-owner receipts, recovery generation, archive behavior, and backup rollback.

There are also explicit limits. The post-merge record does not claim raw JSONL restoration from published 9.4 backups, and older failed runs remain documented as failed. That may sound fussy, but it is useful engineering hygiene for a recovery fix: the claim is bounded to the repaired behavior.

## The Takeaway

This is not a shiny feature, but it is one of those reliability patches that makes the platform feel more grown-up. Session recovery now has a stronger bias toward preserving newer accepted state, validating receipts, and refusing risky rewrites when provenance is missing.

For teams carrying older OpenClaw session histories forward, PR #157615 is worth tracking closely in the next release notes.
