---
title: "OpenClaw Serializes Plugin Repair Custody"
excerpt: "OpenClaw PR #159033 makes plugin repair, refresh, and cleanup serialize ownership decisions so concurrent repairs do not overwrite newer inventory."
coverImage: '/assets/images/posts/openclaw-2026-9-26-plugin-custody-repairs.png'
date: '2026-09-26T23:01:00.000Z'
dateFormatted: September 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-26-plugin-custody-repairs.png'
---

OpenClaw merged [PR #159033](https://github.com/openclaw/openclaw/pull/159033), a high-priority plugin lifecycle fix that tightens source custody during concurrent repair, refresh, cleanup, and Doctor migration flows.

The short version: plugin ownership decisions now serialize through the existing lifecycle lease instead of allowing overlapping producers to derive replacements from stale facts.

That sounds deep in the machinery, but the user-facing problem is concrete. A concurrent registry refresh or Doctor migration could change plugin ownership facts while an installer was deleting replaced source files. A refresh could also derive its replacement before another installer committed, then overwrite the newer inventory. Channel setup could trigger the same shape by passing an old install-record snapshot into a later refresh.

## What Changed

The PR makes index producers acquire the existing plugin lifecycle lease before reading and deriving replacement plugin state. Config refresh now acquires the lease before reading the durable ledger and committed config, and channel post-commit callers stop forwarding old record maps.

Callers that already hold plugin custody keep their explicit replacement and removal contracts. Startup also preserves startup-to-plugin ordering, rereading metadata after lease acquisition. Doctor keeps its maintenance ordering and waits for obligation settlement.

Deferred obligations are now recorded by the shared-state worker, with the actual lease checked at transaction and commit admission. Stored formats and pending-generation comparisons stay unchanged, which is important: this is not a schema migration, config migration, or permission model change.

## Why It Matters

Plugin systems are especially sensitive to stale ownership facts. If an installer, registry refresh, and cleanup pass disagree about which source owns a plugin at the same time, the system can preserve the wrong inventory, delete the wrong replaced source, or lose a newer install record.

PR #159033 protects three practical workflows:

- Plugin repair and refresh now serialize ownership decisions.
- Queued refreshes retain install records committed while they waited.
- Deferred Doctor migration obligations cannot change during leased source cleanup.

The PR also keeps invalid Doctor input conservative. Invalid input still leaves storage untouched, and ordinary refresh failures still attempt runtime discovery-cache invalidation.

## Evidence Behind The Merge

The PR carried `P1`, `gateway`, `cli`, `commands`, `agents`, and `merge-risk: compatibility` labels. That label set is appropriate because plugin lifecycle bugs can show up as upgrade problems, channel setup problems, or stale runtime discovery.

The author reported that both original cleanup races failed on the original code and passed with the change. Queued-refresh and deferred requester-revocation tests also failed on the old behavior and passed with the fix.

Final focused validation included 138 tests across eight suites, including channel setup, installer and uninstaller siblings, and targeted production lint. Earlier broader validation covered 878 unique tests across 61 affected suites, additional bundled-loader tests, routing contracts, core production typechecks, and core-test typechecks.

The PR also includes built-CLI evidence: an empty legacy directory remained untouched until explicit Doctor repair, and Gateway started after replacing and verifying a stale persisted Doctor index.

## The Bottom Line

This is not a flashy feature release, but it is exactly the kind of hardening OpenClaw needs as plugin installs, repairs, channel setup, and Doctor migrations happen closer together.

By serializing plugin custody at the lifecycle boundary, OpenClaw reduces the chance that one repair path accidentally overwrites another path's fresher truth. For operators, the win is simple: plugin repair and refresh should be more deterministic, especially around upgrades and concurrent maintenance.
