---
title: "OpenClaw Fixes Session Lists After Config Republishes"
excerpt: "OpenClaw PR #155300 stops unchanged config republishes from invalidating every session row and stalling Gateway session lists."
coverImage: '/assets/images/posts/openclaw-2026-10-1-config-republish-session-list-fix.png'
date: '2026-10-01T08:01:00.000Z'
dateFormatted: October 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-1-config-republish-session-list-fix.png'
---

OpenClaw merged a P1 Gateway performance and availability fix Thursday morning for a painful session-list stall. [PR #155300](https://github.com/openclaw/openclaw/pull/155300), titled "fix: session lists stall while the gateway republishes an unchanged config," prevents value-identical config republishes from forcing every projected session row to rebuild.

The visible symptom was serious: `sessions.list` calls could take minutes, and the Gateway could appear to stop answering while config publications repeatedly dirtied session projections that had not actually changed.

## The Root Cause

The affected path lived in runtime config publication. Before this fix, publishing a runtime config snapshot emitted a broad session change even when the effective values matched the already published runtime config.

That was especially bad for scheduled or automated config writers. A tool could rewrite the same config values, perhaps only changing file metadata or formatting, and OpenClaw would still invalidate every projected session row. If another unchanged publication arrived before the drain converged, readers could stack up behind work that did not need to happen.

The PR describes the real trigger as the config write path, not a file-watcher-only quirk. A value-identical `config.apply` can advance source metadata while leaving the runtime object effectively unchanged.

## What Changed

OpenClaw now records what session rows actually depend on when a runtime config is published. The Gateway compares the current publication against the recorded value fingerprint and serialized resolution facts, rather than only looking at object identity or comparing against a live object that may have been edited in place.

That lets OpenClaw withhold a session-change emission when a source-only republish cannot change session rows. The guard is deliberately narrow. It still refreshes rows when values move, when resolution provenance changes, or when an in-place edit could have changed what projected rows should contain.

In simpler terms: unchanged config writes stop causing broad session churn, while real config changes still rebuild the rows that need rebuilding.

## Why It Matters

Session list responsiveness is part of the Gateway's everyday feel. Control UI reconnects, dashboards, operators, and automation all rely on being able to list sessions without waiting behind avoidable projection work.

This fix should be most noticeable on installations where config is managed by automation. If an external process rewrites an equivalent config on a schedule, OpenClaw should no longer treat each write as a reason to rematerialize every session row.

## Validation

The PR includes live Gateway A/B measurements using isolated Linux arm64 Gateways and hundreds to thousands of session rows. In maintainer verification, a value-identical config apply changed first `sessions.list` latency from about 100 ms on the main baseline to under 9 ms on the candidate for a 400-session setup, while real config changes retained their rebuild cost.

The regression coverage also checks the hard boundaries: equivalent distinct objects can be withheld, but changed values, changed provenance, and in-place edits still invalidate. That balance is the whole point of the patch.

For OpenClaw operators, this is a quiet but meaningful Gateway fix. The session list should now reflect actual config changes instead of paying a rebuild tax for unchanged republish noise.
