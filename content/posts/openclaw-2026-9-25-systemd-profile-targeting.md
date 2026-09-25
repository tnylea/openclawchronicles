---
title: "OpenClaw Tightens Systemd Profile Targeting"
excerpt: "OpenClaw status and Doctor now scope systemd Gateway discovery to the active profile, reducing wrong-unit repair risk."
coverImage: '/assets/images/posts/openclaw-2026-9-25-systemd-profile-targeting.png'
date: '2026-09-25T08:03:00.000Z'
dateFormatted: September 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-25-systemd-profile-targeting.png'
---

OpenClaw merged a Linux service-management fix this morning that should matter to anyone running multiple Gateway profiles on the same host. [PR #119674](https://github.com/openclaw/openclaw/pull/119674), "fix(daemon): scope systemd unit resolution to the active profile," makes systemd discovery and Doctor cleanup more careful about which Gateway unit they inspect or repair.

The core issue was risky targeting. Systemd discovery could report another profile's Gateway as the selected service, and Doctor cleanup could later act on a different unit after the originally inspected unit disappeared. On a single-profile machine, that might never surface. On a multi-agent Linux host, it is exactly the kind of bug that can make maintenance commands feel dangerous.

## What Changed

The merged fix keeps canonical, legacy, and explicit unit selection scoped to the requested identity. Status and Doctor now inspect the selected profile, preserve existing default-profile custom system units, and keep cleanup attached to the unit the operator confirmed.

The PR describes several important behaviors:

- Current and legacy unit names remain candidates for competing managers.
- Named-profile, foreign-state, foreign-account, and Node services are excluded.
- Multiple matching custom units remain an ambiguity error.
- `OPENCLAW_SYSTEMD_UNIT` continues to select custom units explicitly.
- Cleanup stays bound to the confirmed user unit instead of falling through to another leftover service.

That last part is the safety story. If Doctor asks for confirmation on one unit, the cleanup should not silently retarget a different one because the environment changed mid-flow.

## Why Operators Should Care

OpenClaw installations are increasingly profile-heavy. A builder might have a default Gateway, a work profile, a test profile, and a Node-managed service on the same Linux box. Service discovery has to distinguish those identities by more than a familiar filename.

This change uses the inspected service's own command and environment to determine identity. The invoking process cannot simply manufacture a match, and opaque wrappers still require an explicit selector.

For operators, the benefit is less surprise. `openclaw status`, managed restart flows, and Doctor cleanup should be more likely to talk about the intended Gateway instead of a nearby service that happens to look similar.

## Compatibility Notes

The PR is careful not to break established default-profile installations that use arbitrary custom system-unit names. If there is no user unit or explicit selector taking precedence, default-profile discovery can still recognize a custom Gateway system unit through the effective-command inspector.

The evidence also names limits. Existing user units are not removed merely because another custom system unit looks similar, and inherited generic install or user-unit hints in restart refusal remain a separate UX follow-up.

## Evidence Behind The Merge

The proof covers service and Doctor tests, duplicate-cleanup defects, config-path behavior, and a published updater scenario using OpenClaw 2026.9.5 as the driver with a locally packaged candidate. The positive systemd proof stopped only the custom default unit, left a peer profile unchanged, installed the candidate, and verified that non-root restart refused with the exact selected custom unit command before mutation.

No live operator configuration or credentials were used.

## The Takeaway

PR #119674 is a classic infrastructure hardening change: not flashy, but important for trust. OpenClaw's Linux service tooling is now more explicit about which Gateway profile it is inspecting, restarting, or cleaning up, which is exactly what multi-profile hosts need.
