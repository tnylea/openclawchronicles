---
title: "OpenClaw Doctor Keeps Scheduled Delivery Bound"
excerpt: "OpenClaw Doctor now preserves current-session scheduled delivery targets, helping reports keep arriving in the conversation that created them."
coverImage: '/assets/images/posts/openclaw-2026-9-13-doctor-keeps-scheduled-delivery.png'
date: '2026-09-13T08:01:00.000Z'
dateFormatted: September 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-13-doctor-keeps-scheduled-delivery.png'
---

OpenClaw merged a high-priority automation repair this morning in [PR #146794](https://github.com/openclaw/openclaw/pull/146794), `fix: preserve scheduled conversation delivery after Doctor`. The change fixes a subtle but painful failure mode: scheduled reports could lose their bound conversation after Doctor repaired the automation store.

For users who rely on recurring reports, reminders, scans, or other scheduled jobs that reply back into the same conversation, this is exactly the kind of repair that keeps automation feeling dependable.

## The Bug

OpenClaw supports a stored delivery target named `current`, meaning an automation can stay bound to the conversation that created it. That is useful for session-local scheduled reports: the job does not need a separate Slack channel, Discord channel, email address, or explicit external destination.

The problem was Doctor repair. When Doctor normalized legacy automation data, it converted `current` targets into `isolated`. That broke the link between a scheduled job and the conversation it was expected to return to.

The PR says this affected scheduled reports after Doctor repairs the automation store. Jobs that were already rewritten to `isolated` still need their intended target restored separately; the fix does not guess at old intent.

## What Changed

The implementation preserves `current` through OpenClaw's existing canonical-target normalization path. That is an important detail. The fix does not broaden permissions, invent a fallback destination, or route scheduled output somewhere new.

The repaired behavior is straightforward:

- Current-session automations keep delivering to their original conversation.
- Intentionally isolated jobs remain isolated.
- Explicit external destinations keep their existing behavior.
- Disabled jobs are not silently re-enabled.
- Jobs already rewritten to isolated are not guessed back into place.

That last point is a little unsatisfying, but it is the safer call. Delivery targets are authority-bearing metadata; guessing could send private automation output to the wrong place.

## Why It Matters

Doctor is supposed to make a broken OpenClaw install more trustworthy, not introduce a new routing surprise. Scheduled jobs are especially sensitive because they often run when the user is not actively watching the system. If a recurring report stops reaching the original conversation, the failure can look like silence rather than an obvious error.

By preserving `current`, OpenClaw keeps the mental model clean: a report created in a conversation can keep coming back to that conversation after repair.

## Verification

The PR includes both storage and published-driver validation. The before state reproduced canonical and padded `current` targets changing to `isolated` through legacy JSON import and SQLite repair. The fixed version passed 76 focused tests across migration, repair and reload, target resolution, and delivery preview.

The contributor also reports a published-driver update proof: published `openclaw@2026.9.4` installed the candidate package, ran Doctor, and completed post-update readiness with status `ok`.

This is a small routing fix with a large trust footprint. Scheduled automation depends on boring correctness, and preserving the original delivery target is exactly that.
