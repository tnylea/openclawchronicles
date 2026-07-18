---
title: "OpenClaw Adds Dynamic Cadence To Cron Jobs"
excerpt: "OpenClaw cron jobs can now let agents propose bounded next checks, giving operators adaptive automation without losing schedule control."
coverImage: '/assets/images/posts/openclaw-2026-7-18-dynamic-cron-cadence.png'
date: '2026-07-18T23:01:00.000Z'
dateFormatted: July 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-18-dynamic-cron-cadence.png'
---

OpenClaw's automation layer is getting more flexible. [PR #110978](https://github.com/openclaw/openclaw/pull/110978), `feat(cron): per-job dynamic cadence (pacing + clamped next_check)`, merged at 22:43 UTC on July 18 and adds the first stage of the "everything-is-a-cron" plan.

The change gives cron jobs an operator-bounded way to adapt their next run time. Instead of every job being locked to a static schedule, a paced job can let the running agent propose when the next check should happen.

## What Changed

The new cron pacing contract is additive. Existing jobs without pacing keep their current schedule behavior.

For jobs that opt in, the job can carry a `pacing` object with a minimum bound, a maximum bound, or both. During the currently running job, the agent can call the cron tool's new `next_check` action with a duration such as "in 20 minutes."

OpenClaw then clamps that proposal to the operator's configured bounds after a successful run. A proposal below the minimum moves up to the minimum. A proposal above the maximum moves down to the maximum. No proposal means the old schedule math still applies.

The PR explicitly keeps the proposal scoped to the currently running paced job. The agent cannot set the next check for a different cron job, and unpaced jobs do not expose the proposal path.

## Why It Matters

Static cron is predictable, but it is often too blunt for agent work. A monitor might need to check frequently while something is active, then back off when the system is quiet. A support triage job might want a short follow-up after finding a live thread and a longer pause after an empty scan.

This merge gives OpenClaw a native primitive for that pattern:

- operators define the safe cadence range;
- the agent proposes the next check from inside the job;
- the scheduler enforces the range;
- failures, timeouts, and skipped runs keep existing backoff behavior.

That balance is important. It makes cron adaptive without letting model output become an unbounded scheduler.

## The Persistence Detail

The implementation stores the applied one-shot slot as `state.pacedNextRunAtMs`, mirroring OpenClaw's existing startup catch-up marker pattern. Maintenance repair preserves the exact future slot only when it matches that marker, and clears it on run, edit, or schedule normalization.

That detail is easy to miss, but it is the difference between a nice API and a durable scheduler feature. The proposed time has to survive normal cron maintenance without becoming stale state that hides bad schedules forever.

## Evidence

The PR reports 1,674 passing tests across `src/cron` and the cron agent tool. New seam coverage registers a real run context, invokes the actual `next_check` action, checks the recorded proposal, and rejects invalid paths such as no-pacing jobs, arbitrary-job targeting, and calls outside a run.

Timer tests cover in-range proposals, low and high clamping, single-bound jobs, discarded proposals after errors, and unchanged scheduling when no proposal is made. CLI, parser, service, schema, Gateway protocol, Swift model, and public job projection changes landed with the feature.

## Operator Takeaway

OpenClaw cron jobs can now be both bounded and responsive. The operator still owns the allowed interval, but the agent can choose a sensible next check based on what it just saw.
