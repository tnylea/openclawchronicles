---
title: "OpenClaw Adds Cron Event Triggers"
excerpt: "OpenClaw cron jobs can now poll external conditions with headless scripts, waking agents only when watched state changes."
coverImage: '/assets/images/posts/openclaw-2026-7-7-cron-event-triggers.png'
date: '2026-07-07T23:10:00.000Z'
dateFormatted: July 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-7-cron-event-triggers.png'
---

OpenClaw merged [PR #101195, "feat(cron): event triggers — polled condition-watcher scripts via code mode"](https://github.com/openclaw/openclaw/pull/101195), a major automation update for operators who want agents to react to outside state without waking a full model loop every few seconds.

The practical example from the PR is simple: "wake me when CI on PR 123 changes status." Before this change, that kind of watcher usually meant a heartbeat or scheduled cron run would wake the agent, spend tokens, inspect the outside system, and then do nothing if nothing changed.

Now cron can evaluate a small condition script first. The agent wakes only when the script reports that the watched state changed.

## What Changed

Cron jobs on `every` and `cron` schedules can now carry an optional `trigger` object with a JavaScript condition script. OpenClaw evaluates that script headlessly in the existing code-mode QuickJS sandbox on each due tick.

The trigger script returns a small result:

- `fire: true` runs the normal cron payload.
- `message` can add context to the fired run.
- `state` persists watcher state for the next tick.
- `once` can disarm the trigger after the first successful fired payload.

That means a watcher can remember the last CI status, feed item, deployment phase, ticket state, or any other tool-readable marker, then wake the agent only when the marker changes.

## Why It Matters

This is a good fit for OpenClaw's automation model because it separates cheap condition checks from expensive agent turns.

Polling is not glamorous, but it is often the most reliable integration shape for real-world tools. Many services do not have webhooks. Some webhooks are hard to expose from a private gateway. Others are unreliable or require per-source glue code.

With this PR, anything an authorized tool can read can become a cron trigger source without adding core integration code.

## Guardrails

The feature is off by default behind `cron.triggers.enabled`. That matters because the scripts run unattended with the owning agent's tool policy. If the agent can call powerful tools, the trigger script can too.

OpenClaw adds several bounds around that execution:

- 30-second wall-clock budget per evaluation.
- 5 tool calls per evaluation.
- 16KB persisted trigger state cap.
- 30-second minimum poll interval by default.
- Maximum 3 concurrent trigger evaluations.
- Existing before-tool-call hooks still wrap script-initiated calls.

The PR also avoids creating sessions or snapshots for quiet trigger ticks. If the trigger does not fire, it should stay a cheap scheduler check rather than becoming another transcript.

## Reliability Details

One subtle design choice is important: fired-run state persists only after the payload succeeds. If the payload wakes and then fails, the trigger can detect the same state again and retry instead of silently losing the event.

Force-runs also bypass trigger evaluation, so operators can still manually run the job even when the condition is false.

## Validation

The PR reports broad coverage across headless code-mode execution, trigger script parsing, state caps, concurrency handling, quiet ticks, fired run logs, force-run behavior, CLI flags, RPC gates, and configuration validation.

It also reports a green full `pnpm check:changed` run on Blacksmith Testbox and a clean structured Codex autoreview after earlier review rounds caught and fixed real bugs around trigger catch-up and cron staggering.

## Bottom Line

OpenClaw cron is moving from "run on a clock" toward "watch state, then wake the agent." For operators running lots of automations, that should mean fewer wasted model turns and cleaner event-driven workflows.
