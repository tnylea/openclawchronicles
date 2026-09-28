---
title: "OpenClaw Reuses Plugin Captures During Turns"
excerpt: "OpenClaw now reuses admitted plugin registries on unchanged agent turns, reducing duplicate capture work and Gateway pressure."
coverImage: '/assets/images/posts/openclaw-2026-9-28-plugin-capture-reuse.png'
date: '2026-09-28T23:02:00.000Z'
dateFormatted: September 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-28-plugin-capture-reuse.png'
---

OpenClaw merged a P1 agent-runtime fix Monday night that should reduce duplicate plugin package work during unchanged agent turns.

The change landed in [PR #160658](https://github.com/openclaw/openclaw/pull/160658), titled `fix: prevent repeated plugin captures during agent turns`. It fixes repeated plugin-package captures after the Gateway is already ready, allowing unchanged turns to reuse the plugin registry already admitted for that context.

## What Changed

Plugin captures are part of OpenClaw's runtime safety and loading model. The Gateway admits plugin files, associates them with a context, and uses lifecycle ownership to decide when a registry can be reused or must be loaded again.

The bug was in the handoff between inbound preparation and runtime preparation. Inbound preparation had already selected and admitted a `baseRegistry`, but runtime preparation only offered an older reusable generation to the existing selected-owner coverage check.

The fix passes the admitted base registry into that coverage check. When the current registry is complete, OpenClaw can reuse it. When an owner is genuinely missing, it still falls back to a fresh scoped load.

## Why It Matters

Repeated captures are not just cosmetic churn. They can copy plugin packages again, add filesystem pressure, increase memory use, and delay Gateway responsiveness even when nothing meaningful changed between turns.

The PR says unchanged turns now reuse the already admitted plugin registry. Real plugin changes, configuration changes, generation changes, and missing-owner cases still load through the existing lifecycle owner. That boundary is important: the fix avoids duplicate work without skipping legitimate refreshes.

## Measured Impact

The PR includes a paired performance handoff using canonical packages for the merge parent and exact head. Both ran in alternating fresh Node 24 Linux containers with the same real external provider plugin, a 32 MiB imported source payload, and two real Gateway-backed `openclaw agent` turns.

The reported median affected-turn wall time moved from 8.337 seconds to 8.150 seconds. The bigger result was memory: median peak Gateway RSS during the turn dropped from 1491.3 MiB to 1366.3 MiB, while registrations after the first turn fell from 2 to 1.

The PR is careful about scope. It calls the wall-time improvement modest, but it shows the duplicate registration was removed and the retained capture stayed stable across the unchanged second turn.

## Evidence

The installed behavior proof used a clean Node 24 Linux container, a real external provider plugin, and a loopback synthetic OpenAI-compatible transport. Two successful `openclaw agent` turns ran through the Gateway. The first turn admitted one captured registry; the second unchanged turn created no additional registration or capture root; shutdown removed the retained capture.

The focused regression failed on current main in the covered-owner cases and passed after the fix. A prepared-runtime owner packet reported 57 passing tests across startup registry, inbound registry, registry borrowing, Gateway leases, and runtime-plugin selection.

For operators running plugin-heavy OpenClaw setups, this is the kind of quiet reliability fix that makes later troubleshooting easier: fewer duplicate captures, less avoidable memory pressure, and cleaner registry ownership during ordinary repeated turns.
