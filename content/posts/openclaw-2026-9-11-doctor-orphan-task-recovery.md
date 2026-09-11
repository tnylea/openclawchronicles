---
title: "OpenClaw Doctor Recovers Orphan Task Deliveries"
excerpt: "OpenClaw Doctor can now preserve and remove orphan task delivery rows, helping affected upgrades recover while keeping database evidence intact."
coverImage: '/assets/images/posts/openclaw-2026-9-11-doctor-orphan-task-recovery.png'
date: '2026-09-11T23:02:00.000Z'
dateFormatted: September 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-11-doctor-orphan-task-recovery.png'
---

OpenClaw Doctor has a new preservation-first recovery path for a database condition that could block upgrades.

[PR #145284](https://github.com/openclaw/openclaw/pull/145284), titled `fix: recover orphan task deliveries during Doctor repair`, merged on September 11th at 22:03 UTC. It targets installations where `task_delivery_state` contains rows whose parent `task_runs` rows no longer exist.

The PR says stable 2026.9.4 still refuses that condition. The original producer of the orphan rows is unknown, which makes the shape of this fix important: it repairs the supported Doctor owner without pretending to explain every historical path that created the damage.

## What Changed

Doctor’s existing fenced repair transaction can now preserve a verified database copy and export orphan delivery rows before removing confirmed orphans.

The repair uses existing SQLite snapshot, private-directory, durability, and integrity mechanisms. The copy is WAL-aware, and the row export is described as lossless. Normal runtime admission and healthy-backup admission remain strict.

That means the repair is deliberately narrow. It does not reconstruct missing tasks, replay deliveries, change schema versions, or delete recovery artifacts. If Doctor sees unknown schemas, triggers, unrelated foreign-key damage, preservation failures, or failed final integrity checks, it still refuses and rolls back.

## Operator Impact

Affected operators can complete supported Doctor recovery instead of staying blocked by orphan delivery rows. Doctor reports the recovery directory, and the recovery manifest records preservation.

The expected behavior now is:

- Confirmed orphan delivery rows can be removed by Doctor.
- A verified full database backup is retained.
- Recoverable delivery payloads are exported before deletion.
- Healthy sibling rows remain intact.
- Unrelated database damage still refuses repair.
- Repeat Doctor runs do not keep creating extra recovery archives after the condition is clean.

The PR is careful about what the recovery proves. It does not prove the unknown orphan-producing sequence is fixed, and it does not claim the preserved transaction committed in the original runtime. It keeps evidence while letting affected installations move forward.

## Validation

The validation campaign reproduced the refusal on pinned main and then showed preservation tests failing before the change and passing afterward. Coverage included both the current state and a released 2026.7.1-2 schema fixture.

Seven preservation controls passed, including WAL-only committed rows, all 18 orphan payloads, exact large integers, raw JSON, healthy siblings, unknown schema and trigger refusal, unrelated foreign-key refusal, export failure, and post-delete rollback.

The PR also reports shared-state and task-store suites passing, plus a real process-death proof. In that proof, SIGKILL after deletion but before commit retained the original rows and recovery files; a retry then succeeded with clean integrity and foreign-key checks.

The installed upgrade proof is the most operator-relevant part. The published 2026.7.1-2 runtime passed `tasks list` before orphan injection. Its unmodified update command installed the candidate, ran candidate Doctor successfully, preserved healthy rows byte-for-byte, kept all 18 orphan payloads in both backup and JSONL export, and reached a ready foreground Gateway after repair.

## Known Gap

The PR explicitly leaves one coordinated follow-up open. Newer installed updaters can refuse these orphans while opening the update ledger before Doctor or candidate code runs. That update-admission lane is separate and still needs to reuse this recovery owner.

For affected installations that refuse before candidate execution, the practical first hop may still require manually installing a corrective release and then running `openclaw doctor --fix`.

## Why It Matters

Doctor repairs sit at a high-trust boundary. Users run them when something is already wrong, so the tool has to be both helpful and conservative.

This change strikes that balance. It gives operators a way past a specific upgrade-blocking database condition, but only after preserving the original data and only when integrity checks say the repair is contained. That is the right shape for a recovery path when the failure source is not yet fully known.
