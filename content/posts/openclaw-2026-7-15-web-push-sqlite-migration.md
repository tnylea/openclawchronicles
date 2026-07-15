---
title: "OpenClaw Moves Web Push State to SQLite"
excerpt: "OpenClaw moved Web Push subscriptions and VAPID identity into shared SQLite with an explicit Doctor migration for safer upgrades."
coverImage: '/assets/images/posts/openclaw-2026-7-15-web-push-sqlite-migration.png'
date: '2026-07-15T23:02:00.000Z'
dateFormatted: July 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-15-web-push-sqlite-migration.png'
---

OpenClaw merged a Web Push storage migration today that moves subscriptions and VAPID signing identity out of whole-store JSON files and into the shared SQLite state database. [PR #103294](https://github.com/openclaw/openclaw/pull/103294), titled `refactor(push-web): move web push store to shared SQLite state DB`, merged at 19:54 UTC on July 15.

This is an upgrade-path story more than a feature launch. The change targets a familiar reliability problem: JSON stores are easy to reason about when one process owns them, but they become fragile when concurrent Gateway processes can register, deliver, delete, or generate keys around the same files.

## What Changed

The PR replaces the old `push/vapid-keys.json` and `push/web-push-subscriptions.json` state with typed SQLite rows and synchronous row-level transactions. The runtime no longer falls back to the retired JSON files.

That fail-closed behavior is intentional. If a retired source file or interrupted Doctor claim remains, registration, delivery, deletion, and key resolution are blocked instead of silently using state that might be stale, conflicting, or half-migrated.

OpenClaw Doctor owns the upgrade repair. The PR says `openclaw doctor --fix` takes exclusive state ownership, validates and claims the retired files, imports them atomically, verifies the committed rows, and removes only verified claims.

## Why Operators Should Care

Web Push is one of those surfaces where a small state bug can look like a random delivery problem. Lost registrations mean users stop receiving notifications. Competing VAPID identities can make a previously valid subscription impossible to use. Whole-file writes make those problems harder to eliminate under concurrency.

SQLite does not magically make every state problem disappear, but row-level transactions give OpenClaw a better foundation for concurrent Gateway behavior and verified migrations.

The operator-facing note is direct: if an upgrade finds retired Web Push JSON state, stop the Gateway and run `openclaw doctor --fix` before using Web Push again.

## Recovery Details

The PR also keeps expired-subscription cleanup best-effort. That choice prevents a cleanup failure from making callers retry notifications that were already delivered, which is a small but important availability detail.

Regression coverage listed in the PR includes concurrent registration, first-use key generation, compare-and-delete expiry races, pending legacy runtime gates, cleanup failure and retry, malformed stores, symlink/path-race confinement, interrupted claims, and live-Gateway exclusion.

## Upgrade Takeaway

This change is the kind of storage migration that most users should never notice once it is complete. The important part is the explicit repair path: stop the Gateway, let Doctor claim and verify the retired files, then resume Web Push on the shared database.

For teams that rely on browser push notifications from OpenClaw, this is a durability upgrade worth tracking before the next stable release.
