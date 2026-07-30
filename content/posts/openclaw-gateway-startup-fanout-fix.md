---
title: "OpenClaw Speeds Up Multi-Agent Gateway Startup"
excerpt: "OpenClaw now prepares shared workspace facts once so large multi-agent gateways start faster and use less memory during onboarding."
coverImage: '/assets/images/posts/openclaw-gateway-startup-fanout-fix.png'
date: '2026-07-30T08:01:00.000Z'
dateFormatted: July 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-gateway-startup-fanout-fix.png'
---

OpenClaw merged a P1 Gateway performance fix this morning for users who run several configured agents from the same install. [PR #116261](https://github.com/openclaw/openclaw/pull/116261), titled `fix(gateway): prevent multi-agent startup stalls`, changes how startup prepares model and workspace state before the Gateway is ready to admit turns.

The bug was straightforward to feel and hard to ignore: a fresh Gateway or onboarding TUI could take minutes to become ready when many agents were configured. The PR describes a 12-agent shape where 11 agents shared one workspace and one used another. Before the fix, startup rebuilt broad model-discovery state once per agent, consumed roughly one CPU core, peaked around 1.2 to 1.5 GiB RSS, and delayed event-loop readiness.

## What Changed

OpenClaw now prepares only the turn-critical model facts during static Gateway startup. Process and config facts are captured once per generation, workspace and plugin facts are built once per distinct workspace, and immutable preparation facts are projected into isolated per-agent runtime snapshots.

That last part matters. The fix is not a shared mutable cache that risks crossing agent boundaries. Agents that share a workspace can reuse expensive preparation work without sharing configured-model state or auth state.

The full model catalog also moves off the correctness-critical startup path. Explicit catalog consumers, such as model listing, selection, and diagnostics, still get the complete catalog through a lazy generation-bound single-flight path with concurrency set to one.

## Why Operators Should Care

Multi-agent setups are increasingly normal for OpenClaw operators. One install might have a personal assistant, a code agent, a calendar agent, a support agent, and a few automation-focused subagents. If each agent multiplies startup model discovery, the Gateway becomes less reliable precisely when a setup gets more useful.

The PR reports a representative benchmark where the 12-agent prepared-runtime time dropped from 17.302 seconds to 0.459 seconds. End-to-end completion fell from 24.869 seconds to 5.035 seconds, CPU dropped from 32 seconds to 10 seconds, and peak RSS fell from 1535.7 MiB to 878.4 MiB.

That is the kind of change that low-resource hosts feel immediately. It should also reduce confusing onboarding stalls where the system is technically starting but not yet responsive.

## Verification

The regression proof covers shared-workspace agents, distinct workspaces, per-agent configured-model and auth isolation, workspace and plugin fact sharing, bounded build concurrency, stale generations, owner-scoped invalidation, lazy full-catalog loading, and atomic publication.

The PR also reports 60 focused tests across benchmark tooling, Gateway event-loop behavior, and prepared-runtime lifecycle. Architecture, type, lint, build, secret-scan, and autoreview gates passed.

The practical takeaway: OpenClaw Gateway startup now scales by distinct workspace preparation work instead of repeating broad discovery for every configured agent.
