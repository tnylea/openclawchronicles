---
title: "OpenClaw Cron Jobs Stop False Setup Timeouts"
excerpt: "OpenClaw merged a cron watchdog fix so isolated jobs making healthy setup progress can use configured timeouts instead of dying at the old 60-second guard."
coverImage: '/assets/images/posts/openclaw-2026-8-21-cron-setup-progress.png'
date: '2026-08-21T08:00:00.000Z'
dateFormatted: August 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-21-cron-setup-progress.png'
---

OpenClaw's morning merge window includes a practical fix for anyone who runs isolated cron agents with heavier setup work. [PR #93914](https://github.com/openclaw/openclaw/pull/93914), merged on August 21st, changes how the cron watchdog interprets early setup phases so healthy jobs are not killed as stalled before they ever reach the main execution body.

The issue was narrow but frustrating: an isolated job could be actively preparing context, plugins, auth, or model setup, yet still trip the old 60-second pre-execution guard. The PR describes the failure mode as healthy setup being aborted as "stalled before execution start" even when the job had a longer configured timeout.

## What Changed

The cron watchdog now treats the first valid setup phase after runner entry as real progress. That matters because isolated jobs often do useful work before the user's script or model turn appears to have formally started.

The configured job timeout remains the authority once setup has begun. In the PR's boundary test, a job with `timeoutSeconds: 1200` stayed alive after the old 60.1-second failure point and was then governed by the configured 1,200-second wall timeout.

The fix does not loosen every guard. Runner entry with no progress remains bounded, and later fallback candidates in the same model fallback chain still get their own fresh pre-execution window. In other words, OpenClaw is distinguishing slow-but-moving setup from a genuine pre-run stall.

## Why Cron Operators Should Care

This is the sort of reliability patch that will not show up in a flashy UI screenshot, but it affects whether unattended automation feels trustworthy. Morning scans, inbox triage, deployment checks, data imports, and long-running maintenance jobs can all spend time loading context before the user-visible work starts.

The user impact is straightforward:

- Isolated cron jobs can use their configured timeout during healthy setup.
- Slow workspace, plugin, model, auth, or context setup is less likely to be misclassified as a stall.
- True no-progress starts and fallback candidates still stay bounded by watchdog protection.
- Timeout defaults, delivery behavior, provider routing, and channel behavior are unchanged.

That last point is important. The PR is not making cron jobs run longer by default; it is making the existing timeout contract apply to the right phase of execution.

## Validation

The evidence list is unusually direct for a scheduler fix. The changed behavior was covered across cron watchdog, timer timeout, isolated payload fallback, and interim retry tests, totaling 81 passing tests across four focused files.

The PR also reports 20 consecutive stress iterations of the focused watchdog and timer tests, plus changed-file checks for formatting, lint, typechecks, dead code, import cycles, and policy guards.

## Bottom Line

OpenClaw cron is becoming more precise about what "stalled" means. If a job is doing setup work, that now counts. If it never makes real progress, the watchdog still steps in.

For anyone using OpenClaw as a background operator instead of a chat-only assistant, [PR #93914](https://github.com/openclaw/openclaw/pull/93914) is a meaningful automation reliability improvement.
