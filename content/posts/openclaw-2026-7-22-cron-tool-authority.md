---
title: "OpenClaw Cron Jobs Get Explicit Tool Authority"
excerpt: "OpenClaw now persists explicit tool authority for new tool-capable cron jobs, making scheduled permissions inspectable and durable."
coverImage: '/assets/images/posts/openclaw-2026-7-22-cron-tool-authority.png'
date: '2026-07-22T08:03:00.000Z'
dateFormatted: July 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-22-cron-tool-authority.png'
---

OpenClaw's automation system took a security-minded step forward with [PR #112483](https://github.com/openclaw/openclaw/pull/112483), titled "fix(cron): persist explicit scheduled tool authority." The PR fixes a subtle but important cron problem: newly created tool-capable jobs could be saved without an explicit tool policy.

That ambiguity matters because cron jobs run later, often without the original sender context. If a scheduled job can call tools, the system needs a durable answer to a basic question: which tools was this job allowed to use when it was created?

## What Changed

New tool-capable cron jobs now persist explicit authority. Agent-created jobs are capped to the final tool surface available in the creating turn. Trusted operator and service-created jobs default to an explicit unrestricted `*` grant.

The PR deliberately leaves existing capless jobs alone. They remain legacy jobs and are not silently migrated during startup, ordinary edits, or declarative convergence. Operators can adopt explicit unrestricted semantics with `cron edit --clear-tools`, or set a narrower tool list with `--tools`.

The implementation is described as Phase 1 for issue #111809. It establishes the producer invariant first and intentionally does not yet broaden cron runtime authorization.

## Why It Matters

Scheduled automation is one of the places where permission clarity matters most. A chat turn happens in front of a user or operator. A cron job may run hours later, with no person actively steering the session.

Persisting an explicit tool policy makes the scheduled job's authority stable and inspectable. It also reduces the chance that future runtime changes have to guess whether a capless job was intentionally unrestricted or simply missing metadata.

The fail-closed parts are especially important. Agent-runtime requests that omit a required cap fail before they can inherit trusted service defaults, while QQ reminders explicitly record that they need no tools. That preserves a clear difference between ordinary reminders, agent-created tool jobs, and trusted operator jobs.

## The Upgrade Boundary

The PR does not add a new SQLite schema, protocol field, config surface, or parallel authority object. That is a meaningful constraint because cron jobs already exist in live installations.

Instead, the change keeps old capless jobs working as they did before while making newly created jobs explicit. This kind of compatibility boundary is less flashy than a new feature, but it is exactly the sort of work that keeps automation systems upgradeable.

## Proof From The PR

The evidence section is unusually deep. The focused Vitest proof reports 583 passing tests across cron service and convergence behavior, Gateway admission, creator-cap planning, tool resolution, CLI clear semantics, and QQ reminder paths.

The PR also reports packaged Docker end-to-end coverage, live-model producer matrices for restricted and unrestricted cases, Gateway restart durability checks, same-state upgrade proof, and a final clean autoreview pass after accepted harness findings were fixed.

For OpenClaw operators, the headline is straightforward: new scheduled jobs now carry explicit durable tool authority instead of relying on ambiguous capless state.
