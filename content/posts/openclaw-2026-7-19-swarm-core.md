---
title: "OpenClaw Swarm Core Brings Gated Agent Fan-Out"
excerpt: "OpenClaw merged a gated Swarm core with collector sessions, structured child output, fan-out caps, and an agents_wait tool."
coverImage: '/assets/images/posts/openclaw-2026-7-19-swarm-core.png'
date: '2026-07-19T08:02:00.000Z'
dateFormatted: July 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-19-swarm-core.png'
---

OpenClaw's Swarm program has its first core merge. [PR #110932](https://github.com/openclaw/openclaw/pull/110932), `feat(agents): Swarm core — collector spawn, agents_wait, structured output, caps (gated)`, merged at 06:30 UTC on July 19 and adds the foundational machinery for deterministic multi-agent fan-out.

The important word is "gated." The new system is behind `tools.swarm`, which defaults off. With the gate closed, the PR says the only behavior change is parameter rejection with a clear error. When enabled, OpenClaw gets a much more explicit way to spawn child agents, wait for them, cap concurrency, and collect structured output.

## What Changed

The new Swarm core extends `sessions_spawn` with collector-oriented fields:

- `collect`, for a waitable completion record instead of ordinary announce-and-steer behavior;
- `outputSchema`, for validated structured child output through an injected structured-output tool;
- `fastMode`, for the faster execution lane;
- `groupId`, for bounded group scheduling;
- default child identity from `tools.swarm.defaultAgentId`, validated against the existing target allowlist.

It also adds `agents_wait`, a new tool for first-completion race semantics. In practical terms, a parent can spawn multiple children, wait for one or more to settle, and re-read results idempotently within bounded timeouts.

## Why It Matters

OpenClaw already supports subagents, but deterministic orchestration is a higher bar than launching background work. Without a shared owner for spawn, completion, and settle semantics, each harness or runtime risks inventing its own almost-compatible version of fan-out.

This PR creates a canonical core that both QuickJS code-mode surfaces and the Codex-harness projection can build on. That matters for reliability and portability: a swarm should not mean one thing in a browser session and another thing in a CLI-backed run.

## The Safety Rails

The scheduler is not an unbounded burst switch. The PR adds per-group FIFO scheduling with `maxConcurrent`, `maxChildrenPerGroup`, and `maxTotalPerGroup`. Collector children run approvals-fail-closed, which means denied approvals are reported in results instead of turning into operator prompts from nested child work.

Persistence is additive. The implementation adds columns to existing registry and state stores without a schema-version bump, and the Gateway protocol change is made through optional additive fields.

That combination is a sensible first landing for a feature with obvious power and obvious risk. Fan-out is only useful if operators can reason about how many children are running, what they can do, and how their results return to the parent.

## Evidence

The PR reports focused test coverage across swarm config, swarm scheduling, the `agents_wait` tool, structured output, swarm tools integration, and agent request preflight. A post-rebase full proof ran on Blacksmith Testbox, including the state database suite used for schema reconciliation.

Autoreview also pushed the implementation on two practical points: avoiding per-request registry scans and emitting balanced collector lifecycle events. The final implementation maintains a run map for collector lookup and emits `subagent_progress` and `subagent_spawned` from the scheduler start callback.

## Operator Takeaway

Swarm core is not fully user-facing yet, and the follow-up list still includes the QuickJS `agents.run` surface and event-driven wait improvements. But the architecture is now in place: OpenClaw can start treating multi-agent orchestration as a governed runtime capability instead of a loose collection of child session tricks.
