---
title: "OpenClaw Fixes Case-Distinct Model Status Routes"
excerpt: "OpenClaw now keeps case-distinct custom model IDs separate in status checks, preventing healthy routes from being marked incompatible during diagnostics."
coverImage: '/assets/images/posts/openclaw-2026-9-6-case-distinct-model-status.png'
date: '2026-09-06T23:10:00.000Z'
dateFormatted: September 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-6-case-distinct-model-status.png'
---

OpenClaw has merged a focused diagnostics fix for custom model routes that differ only by case. [PR #140099](https://github.com/openclaw/openclaw/pull/140099), "fix(models): prevent case-distinct status routes from mixing," landed on September 6, 2026 at 22:58 UTC.

The issue was narrow but frustrating for operators who run more than one custom model configuration. The PR says `openclaw models status --check` could report a healthy custom model as incompatible when other configured model IDs differed only by case and used different adapters.

In practice, that means a model status check could make the wrong route look broken even though the underlying route was healthy.

## What Changed

Status observations now use the provider-owned model identity and the shared provider-prefix normalizer. That keeps distinct model IDs separate while preserving the existing physical-route order and snapshots.

The change is intentionally confined to diagnostic projection. The PR states that routing, authentication, and persistent-data contracts are unchanged.

The implementation also removes four redundant lazy-loader forwarding functions. That cleanup is secondary to the operator-facing fix, but it makes the status path easier to maintain without broadening the behavioral surface.

## Why It Matters

Custom model routing is one of the places where small diagnostic mistakes can waste a lot of time. If `models status --check` says a route is incompatible, operators naturally start looking at credentials, adapters, provider prefixes, or model availability.

When the actual problem is a case-sensitive identity collision in the diagnostic layer, the report sends them in the wrong direction.

This repair keeps model identity closer to provider ownership. That is especially useful for teams with conventions that intentionally distinguish model IDs by case, or for configurations that mix provider-prefixed catalog rows with local custom entries.

## User Impact

The direct user impact is clearer status output. Custom model IDs that differ only by case now receive independent diagnostics, and provider-prefixed catalog rows remain supported.

The PR does not claim a routing change. A model that worked before should route the same way after the fix. The difference is that the diagnostic command should stop confusing healthy case-distinct entries with incompatible neighbors.

That matters because status checks often run before deeper troubleshooting or automation. Cleaner diagnostics reduce false alarms without asking users to change their config.

## Validation

The evidence includes a real CLI baseline where a healthy Writer control exited 0, while changing only the model ID and its references to a differently cased Reader reproduced the false ambiguity and exit 1. The candidate proof then added a regression test and ran 109 tests across seven owner and sibling files.

The PR also reports that build, changed-file gates, typechecks, formatting, lint, and selected guards passed. Exact-head upstream CI completed successfully, including the required `openclaw/ci-gate`.

For OpenClaw users, the headline is simple: model status checks now respect case-distinct custom routes instead of blending their diagnostic facts together.
