---
title: "OpenClaw Adds Mobile Automations Parity"
excerpt: "OpenClaw's iOS and Android apps now expose richer Automations management with search, filters, safe edits, Run Now tracking, and history."
coverImage: '/assets/images/posts/openclaw-2026-7-13-mobile-automations-parity.png'
date: '2026-07-13T23:01:00.000Z'
dateFormatted: July 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-13-mobile-automations-parity.png'
---

OpenClaw merged native mobile Automations parity Monday night, giving iOS and Android a more complete management surface for scheduled Gateway work. The PR closes a gap where the web Control UI could manage cron-style jobs, but native mobile clients had only partial access.

This is a practical feature story. Automations are how OpenClaw operators turn recurring agent work into a durable system, and mobile apps are often where those jobs need to be inspected, paused, or run while away from a desk.

Source: [OpenClaw PR #106355](https://github.com/openclaw/openclaw/pull/106355)

## What Changed

The PR renames the native surface to **Automations** on both iOS and Android. Both apps now support search and three primary filters: All, Active, and Paused.

iOS gets the larger expansion:

- configuration detail
- recent run history
- revision-safe editing
- enable and pause controls
- Run Now tracking
- confirmed deletion
- complete-list pagination
- unsaved draft preservation

Android keeps its existing management surface while adopting the same product naming and discovery controls.

The PR intentionally leaves creation, cloning, and dense delivery or failure-routing edits in the web Control UI. That boundary keeps the mobile surface focused on safe management instead of trying to replicate every advanced desktop workflow.

## Safety Boundary

The most important implementation detail is that mobile clients continue using the existing `cron.*` Gateway contract. The PR does not add a new protocol or configuration surface.

Edits use `expectedConfigRevision`, which means a mobile client has to prove it is editing the revision it reviewed. If the connected Gateway changes, the operation fails closed instead of applying stale work through the wrong connection.

Queued runs are also tracked by exact `runId`, and native cron pagination gets caller-scoped revisions so clients retry rather than stitching together pages across concurrent scheduler changes. Those details sound small, but they prevent exactly the kind of mobile race conditions that make automation tools feel untrustworthy.

## User Impact

For operators, the result is more direct control from the phone:

- Find an automation quickly.
- Filter to active or paused jobs.
- Inspect how it is configured.
- Check recent history.
- Pause a noisy job.
- Run a job immediately.
- Delete a job after confirmation.

That is enough to handle common "I'm not at my laptop" maintenance without making mobile the only place to do advanced scheduling design.

## Verification

The PR reports Android unit coverage for cron management, runtime behavior, Settings filters, and Skills management. On iOS, 13 Automations model, revision, pagination, outcome, and admission tests passed on iPhone 17 Pro running iOS 26.5.

It also reports native screenshot XCUITests for Automations and Skills screens, a source-blind Android behavior pass for navigation and filtering, and 4,482 synchronized localization entries across 21 locale artifacts.

OpenClaw has been steadily making native clients more operational rather than merely conversational. Automations parity is another step in that direction: the agent can keep running scheduled work, and the operator can manage it from the device already in hand.

