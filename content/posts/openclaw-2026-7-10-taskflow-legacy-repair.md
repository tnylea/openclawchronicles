---
title: "OpenClaw Repairs Legacy TaskFlow State"
excerpt: "OpenClaw now self-heals a legacy TaskFlow delivery status that could hide persisted tasks after older state migrations."
coverImage: '/assets/images/posts/openclaw-2026-7-10-taskflow-legacy-repair.png'
date: '2026-07-10T23:02:00.000Z'
dateFormatted: July 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-10-taskflow-legacy-repair.png'
---

OpenClaw's TaskFlow state migration path received a P1 repair in [PR #103946](https://github.com/openclaw/openclaw/pull/103946), merged minutes before the July 10 nightly cutoff. The fix targets a legacy delivery-status value that could make persisted tasks disappear from the in-memory registry after upgrade.

The affected value is the old `delivery_status = "not-requested"` literal. Earlier sidecar migration code could accept and archive rows containing that value, but the stricter canonical parser later rejected it. The underlying rows still existed in shared SQLite state, yet TaskFlow could report dependencies as missing.

## Why the Bug Was Subtle

This is the kind of migration bug that can be hard to notice during normal testing. The data is not deleted. The sidecar migration can appear successful. The row is archived. The failure shows up later when the runtime tries to restore tasks into the registry and rejects a value that no longer matches the canonical schema.

That distinction matters for TaskFlow users because dependencies are part of the product contract. If blocked work suddenly looks missing, an agent or operator can lose track of what is waiting, what is complete, and what still needs attention.

## Two Repair Paths

PR #103946 fixes both future imports and already affected installations.

For future sidecar imports, OpenClaw now normalizes only the known obsolete `not-requested` value to the canonical `not_applicable` value before comparison and insertion. That keeps the parser strict for everything else.

For databases that were already migrated, OpenClaw repairs the same exact literal inside the normal database-open migration transaction. This does not require the archived sidecar to still be available, and the repair is idempotent across repeated opens.

The PR explicitly avoids broader shortcuts such as parser aliasing, per-row skipping, partial snapshot restoration, or hiding the TaskFlow audit symptom. That is the right call. A migration repair should correct the known historical value without making the storage layer more permissive than it needs to be.

## What Users Should See

Affected installations should self-heal the next time shared state opens. Persisted tasks can become visible to the registry again, and TaskFlow dependency linkage no longer depends on an archived sidecar file that may already be gone.

The warning path also improves. Restore failures now include the rejected persisted value, which gives operators and maintainers a more useful clue if another state issue appears later.

## Why It Matters

OpenClaw is leaning harder on durable tasks, detached work, and scheduled automation. That makes state migrations one of the most important reliability surfaces in the project. A task that exists on disk but vanishes from the registry is exactly the kind of failure that can undermine trust in long-running agents.

This repair is small in scope but important in effect. It preserves strict runtime validation while giving legacy users a clean recovery path. For anyone running older TaskFlow sidecars through newer OpenClaw builds, that is the right balance between compatibility and data integrity.
