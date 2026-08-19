---
title: "OpenClaw Workboard Recovers Interrupted Launches"
excerpt: "OpenClaw Workboard cards no longer stay permanently running when Gateway restarts between worker preparation and acceptance."
coverImage: '/assets/images/posts/openclaw-2026-8-19-workboard-launch-recovery.png'
date: '2026-08-19T08:01:00.000Z'
dateFormatted: August 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-19-workboard-launch-recovery.png'
---

OpenClaw merged a Workboard state repair in [PR #126170](https://github.com/openclaw/openclaw/pull/126170), fixing a failure mode where cards could remain permanently running after a restart landed at exactly the wrong time.

The bug lived in the window between preparing a worker launch and durably recording that the worker had accepted it. If the dispatcher or Gateway restarted inside that gap, Workboard could persist a running association without enough durable launch state to decide whether the worker should be adopted or marked failed.

That left the card in a bad product state: not clearly active, not clearly failed, and not recoverable without operator attention.

## What Changed

Workboard now stores a typed durable launch lifecycle in the existing `automation_json` payload. A launch can be prepared, accepted, or failed.

The dispatcher persists preparation before calling the worker runtime. It then records acceptance through a fenced store transition. After a restart, lifecycle reconciliation can inspect durable state and choose the right outcome:

- Adopt a session that proves worker acceptance.
- Fail a missing prepared launch visibly.
- Defer judgment when snapshots are incomplete.
- Ignore stale delayed failures that belong to an older retry.

The PR explicitly says it does not change the SQLite schema, persisted envelope version, or Gateway protocol. The repair is about clearer ownership of launch state, not a storage migration.

## Why It Matters

Workboard is meant to coordinate long-running agent work. If a card can get stuck in "running" forever after a restart, the board stops being a reliable source of truth.

This fix gives Workboard enough durable vocabulary to recover from interruption. Prepared launches are no longer just process-local intent. Accepted launches can be reattached to their canonical sessions, and missing launches can become visible blockers instead of silent limbo.

The retry protection is also important. A delayed failure from an older attempt should not overwrite a newer launch that is already moving. PR #126170 ties failures and lifecycle observations to the exact prepared identity so stale events cannot corrupt the current card state.

## User Impact

Operators should see fewer permanently running Workboard cards after Gateway or dispatcher restarts. Accepted workers can continue under their canonical sessions, and genuinely missing launches should surface as blocked instead of pretending to run forever.

For teams using Workboard as an automation queue, that makes restart recovery less mysterious and much easier to triage.

## Evidence From The PR

The PR cites a Blacksmith Testbox run, a focused command covering four files and 222 tests, targeted formatting, lint, production and test typechecks, extension typechecks, `git diff --check`, and a clean Codex autoreview with 0.97 overall correctness confidence.

The restart coverage used a shared backing store with the original prepare, process-loss, replacement-store ordering. That is a useful proof shape because it exercises the exact durability window that caused the stuck-card behavior.
