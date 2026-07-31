---
title: "OpenClaw Keeps Cron Recovery In SQLite"
excerpt: "OpenClaw now keeps cron jobs, malformed-job quarantine, and recovery history inside shared SQLite state instead of runtime JSON files."
coverImage: '/assets/images/posts/openclaw-2026-7-31-cron-sqlite-quarantine-recovery.png'
date: '2026-07-31T23:04:00.000Z'
dateFormatted: July 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-31-cron-sqlite-quarantine-recovery.png'
---

OpenClaw's cron system picked up a substantial reliability repair tonight. [PR #117071](https://github.com/openclaw/openclaw/pull/117071), `fix(cron): prevent lost jobs and runtime JSON quarantine files`, moves malformed-job recovery and scheduler coordination back to the existing shared SQLite state database.

The problem was subtle but serious. Operators with malformed scheduled automations could lose recovery data, see new `jobs-quarantine.json` runtime files appear, or have one cron service overwrite jobs created by another service. The same PR also cleans up documentation that still pointed users at the retired `cron.store` setting.

Cron is one of OpenClaw's most important "set it and trust it" surfaces. If scheduled jobs are used for heartbeat checks, follow-ups, maintenance work, or reminders, recovery state has to survive bad rows, upgrades, and concurrent service activity without creating a second source of truth.

## SQLite As The Owner

The fix keeps jobs, run history, scratch data, and malformed-job recovery inside the shared SQLite state database. Runtime quarantine and active-row removal now commit atomically, which reduces the chance that a broken job is half-removed, half-recovered, or hidden in a sidecar file.

The PR also narrows migration ownership. `openclaw doctor --fix` is now the path that imports and safely archives historical JSON quarantine files. Runtime cron service code no longer creates fresh JSON quarantine state as part of normal operation.

That distinction is good product hygiene. Doctor handles repair and migration. Cron handles scheduling. Operators get a clearer model of where state lives.

## Cross-Service Reliability

The PR body calls out another important repair: scheduler operations now share the real SQLite partition identity, reconcile individual rows, and invalidate stale service snapshots only after another committed partition write.

In practical terms, that means concurrent cron services should be less likely to step on each other. A service that sees stale data should refresh around committed database state instead of treating its old snapshot as authoritative.

Existing SQLite partition identifiers, third-party plugin SDK signatures, and the database schema version remain unchanged. That keeps the fix focused on behavior and recovery rather than forcing a public compatibility break.

## Why This Deserves Coverage

This is not a flashy feature, but it is a meaningful availability fix. Lost scheduled jobs create the worst kind of automation bug: work that users think will happen later simply does not happen.

PR #117071 is labeled `P1`, `proof: sufficient`, `merge-risk: compatibility`, and `merge-risk: availability`. It also includes a concrete built-CLI proof: a real historical quarantine sidecar was seeded in an isolated state directory, `openclaw doctor --fix --non-interactive` was run, and verification confirmed one SQLite quarantine row, preserved original timestamp and state, no active JSON sidecar, and a legacy archive.

The broader evidence included 2,118 tests across 172 files, the complete cron suite, doctor coverage, heartbeat concurrency tests, changed-file checks, a full production build, and 115 focused post-rebase tests. For anyone relying on OpenClaw's scheduled automations, the value is simple: cron recovery state now has one durable owner, and malformed jobs should be recoverable without stray runtime files.

