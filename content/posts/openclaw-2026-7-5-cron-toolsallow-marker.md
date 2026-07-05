---
title: "OpenClaw Cron Edits Stop Breaking CLI Runs"
excerpt: "OpenClaw now preserves default tool policy markers when scheduled jobs are edited, preventing CLI backend cron runs from failing later."
coverImage: '/assets/images/posts/openclaw-2026-7-5-cron-toolsallow-marker.png'
date: '2026-07-05T08:01:00.000Z'
dateFormatted: July 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-5-cron-toolsallow-marker.png'
---

OpenClaw merged [PR #100203, "fix(cron): job edits no longer break CLI-backend runs by stripping the default toolsAllow marker"](https://github.com/openclaw/openclaw/pull/100203), a small but important reliability fix for scheduled jobs that run through CLI backends.

The failure mode was surprisingly sharp. A cron job could be created with OpenClaw's default tool inventory, run correctly, then start failing after an unrelated edit to the job. The edit did not need to touch tools at all. In the production trace cited by the PR, an agent edited its own scheduled job prompt text and every later run failed until the payload was manually repaired.

The error was explicit: `CLI backend claude-cli cannot enforce runtime toolsAllow; use an embedded runtime for restricted tool policy`.

## What Went Wrong

OpenClaw cron jobs created through the cron tool receive the default tool list in `payload.toolsAllow`. That list is marked internally with `toolsAllowIsDefault: true`, which tells later runtime code that the list is a default snapshot rather than a user-authored restriction.

That marker matters because CLI backends cannot enforce arbitrary runtime tool restrictions. OpenClaw intentionally fails closed when it sees an explicit restricted list on a backend that cannot enforce it.

The bug lived in the edit path. The cron tool's model-facing schema did not expose the default marker. When an agent edited a job, it could echo the unchanged tool list back without the marker. OpenClaw then treated the unchanged default list as a new explicit restriction. The next CLI-backed run correctly refused to start.

## The Fix

The new behavior preserves the default marker when an edit leaves the list unchanged. In other words, the same default list can no longer be silently reclassified as an explicit restriction just because the model-facing patch omitted an internal flag.

The PR keeps the important safety boundaries intact:

- An unchanged default-stamped list remains a default.
- A genuinely changed list still becomes an explicit choice.
- `toolsAllow: null` still clears both the list and marker.
- Kind replacements still need the stamped marker on the patch itself.
- The fail-closed CLI guard remains in place.

That last point is the key security detail. OpenClaw is not making CLI backends pretend they can enforce restricted tool policy. It is only preventing ordinary job edits from corrupting the meaning of the existing default policy.

## Why It Matters

Scheduled jobs are often edited by agents themselves: prompt tweaks, timing adjustments, delivery target changes, or small workflow refinements. If those edits can break future runs without touching the tool policy, cron becomes fragile in exactly the place it should be dependable.

This fix restores the expected contract. Editing a scheduled job's message or prompt should not change whether the runtime considers its tool list default or restricted.

It also protects a useful operator workflow: CLI-backed scheduled jobs can continue using default tool access while still rejecting explicit restricted policies that the backend cannot enforce.

## Validation

The PR reports a fail-confirmed regression in `service.jobs.test.ts`: before the fix, a patch with an unchanged list, changed message, and missing marker failed. After the fix, the combined jobs and run-executor message-tool-policy suites passed 132 tests.

An executor-level test also asserts that the CLI run context no longer throws for the repaired default-marker case. Lint and whitespace checks were clean, and the PR landed after manual orchestrator review.

## Bottom Line

OpenClaw cron edits are now less brittle. Agents and operators can adjust scheduled jobs without accidentally turning a default tool inventory into an unenforceable explicit restriction that stops future CLI backend runs.
