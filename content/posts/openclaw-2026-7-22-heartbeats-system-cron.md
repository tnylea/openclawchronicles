---
title: "OpenClaw Moves Heartbeats Into Cron Jobs"
excerpt: "OpenClaw now represents heartbeat monitors as system-owned cron jobs, making agent cadence visible without changing heartbeat behavior."
coverImage: '/assets/images/posts/openclaw-2026-7-22-heartbeats-system-cron.png'
date: '2026-07-22T23:05:00.000Z'
dateFormatted: July 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-22-heartbeats-system-cron.png'
---

OpenClaw merged [PR #112585](https://github.com/openclaw/openclaw/pull/112585), the first stage of a larger automation-unification effort that moves heartbeat scheduling into the cron service. The change replaces OpenClaw's dedicated per-agent heartbeat interval scheduler with system-owned cron monitor jobs.

The user-facing promise is intentionally conservative: heartbeat behavior should stay the same. The operational model, however, becomes easier to inspect and reason about.

## From Hidden Timer To Visible Job

Before this merge, OpenClaw had two scheduling paths. Cron handled ordinary automation jobs, while heartbeat cadence lived inside `heartbeat-runner.ts` through a private interval timer. That split meant heartbeat activity could be active without appearing in cron listings or normal run records.

The PR frames the change as a step toward the RFC's "everything is a cron" end state. Each heartbeat-enabled agent now gets one declaration-keyed monitor job, named like `heartbeat:<agentId>`, converged by the Gateway at cron start and on config reload.

Operators gain visibility through familiar tooling. `openclaw cron list --all` can now show heartbeat monitors with their schedule and state instead of leaving cadence hidden inside a runner timer.

## What Did Not Change

This is not a rewrite of heartbeat semantics. The heartbeat runner still owns the parts that decide whether a tick should actually become a wake:

- cooldown checks
- quiet-hours handling
- flood guards
- busy retry and coalescing
- per-agent dispatch
- event-driven wakes from tasks, hooks, exec events, and session state

The new cron payload is deliberately small. It uses an internal `{kind:"heartbeat"}` payload that pokes `requestHeartbeat({source:"interval", intent:"scheduled"})`. In other words, cron is now responsible for creating the scheduled opportunity, while the heartbeat runner still decides whether the opportunity is due and allowed.

That division is useful. Cron becomes the common scheduler, but heartbeat keeps its domain-specific safety rules.

## System Ownership Matters

The monitor jobs are system-owned, not client-writable. The PR says the boundary is reported in the protocol job schema, rejected by create and patch schemas, and read-only in the Control UI. That is the right shape for internal automation infrastructure: visible enough to debug, protected enough that normal cron editing cannot accidentally mutate agent liveness policy.

The Gateway also prunes monitors for unconfigured agents. That prevents stale heartbeat jobs from hanging around after configuration changes.

## Why This Is Bigger Than Heartbeats

OpenClaw's automation surface has grown quickly: cron, heartbeats, standing orders, tasks, hooks, channel events, and background sessions all need understandable ownership. The dedicated heartbeat timer worked, but it gave OpenClaw two cadence owners. That is harder to audit and harder to expose cleanly in product interfaces.

Bringing heartbeat monitors into cron makes scheduling more legible without forcing users to relearn heartbeat behavior.

The PR leaves several follow-ups for the broader automation program, including migrating `agents.*.heartbeat` config keys into cron job records, adding database-backed per-job scratch space, and moving `HEARTBEAT.md` state into the database. Those are bigger migrations. This merge establishes the runtime shape first.

## Validation

The merge records substantial focused coverage: monitor convergence, pruning, failure containment, heartbeat payload execution, scheduler tests, active-hours E2E tests, and broad `src/cron` plus Gateway cron suites. The PR reports 145 cron and Gateway files covering 1,599 tests, plus 267 heartbeat and runtime-service tests.

For users, the practical result is simple: scheduled heartbeats should feel the same, but they are now visible as part of the cron system. For operators managing multiple agents, that visibility is the real win.
