---
title: "OpenClaw v2026.3.31: Background Tasks Get a Real Control Plane"
excerpt: "OpenClaw v2026.3.31 unifies ACP, subagents, cron, and CLI under one SQLite-backed task ledger — and adds a new `openclaw flows` command to manage them."
coverImage: '/assets/images/posts/openclaw-2026-3-31-background-tasks-flows.png'
date: '2026-03-31T23:00:00.000Z'
dateFormatted: March 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-31-background-tasks-flows.png'
---

OpenClaw v2026.3.31 shipped today with one of the biggest architectural shifts in recent releases: a unified background task control plane that pulls together every type of asynchronous work — ACP runs, subagents, cron jobs, and detached CLI execution — into a single SQLite-backed ledger. If you've been juggling detached runs and wondering where they went, this is the fix.

## What Changed

Before this release, background tasks were split across multiple subsystems that didn't talk to each other cleanly. ACP had its own bookkeeping. Subagent runs had their own lifecycle. Cron jobs were external events. CLI background executions were essentially fire-and-forget.

v2026.3.31 tears that wall down.

Now, all of these run through one unified executor seam, and every task gets a parent record in the same SQLite ledger. Lost-run recovery, auto-cleanup, and lifecycle updates all flow through the same path. When a run finishes, it emerges back through the correct parent thread or session — not as a raw child task that appears out of nowhere.

Contributed by [@mbelinky](https://github.com/mbelinky) and [@vincentkoc](https://github.com/vincentkoc).

## The New `openclaw flows` Command

The most user-facing piece of this change is the new `openclaw flows` CLI surface:

```
openclaw flows list     # see all running and recent task flows
openclaw flows show     # inspect a specific flow
openclaw flows cancel   # cancel an in-progress flow
```

Manual multi-task flows (where you're orchestrating several related jobs) stay separate from one-task auto-sync flows, keeping the interface clean. Doctor recovery hints surface for orphaned or broken flow/task linkage, so debugging stuck runs is no longer a guessing game.

## Why This Matters

If you run OpenClaw with any real agentic workload — scheduled heartbeats, spawned subagents, Codex sessions, cron-driven pipelines — you've probably noticed that auditing "what's running and why" was harder than it should be. The `/status` command got you part of the way, but background work was opaque.

The new ledger gives you visibility into the full execution surface. You can see which detached runs are in-flight, which completed cleanly, and which stalled or blocked. Blocked runs now persist their blocked state and let the flow reopen cleanly on retry, rather than fragmenting into a new job.

## ACP-Specific Improvements

ACP sessions get a notable fix in this release: child runs now properly register for completion tracking and lifecycle cleanup. Previously, a registration failure during cleanup could leave callers with an ambiguous state — they couldn't tell whether an ACP turn that appeared to abort had actually started.

There's also a behavioral fix for ACP runs that exit cleanly on write or authorization blockers: these now correctly mark as `blocked` rather than falsely reporting success, and they wake the parent session with a follow-up so your orchestration loop isn't left hanging.

## Also in v2026.3.31

This release is dense. A few other highlights worth calling out:

- **QQ Bot** is now a bundled channel plugin with multi-account support, slash commands, and media send/receive ([#52986](https://github.com/openclaw/openclaw/pull/52986))
- **WhatsApp reactions** — agents can now react with emoji on incoming messages instead of always typing a reply
- **Android notification forwarding** gets package filtering, quiet hours, and rate limiting ([#40175](https://github.com/openclaw/openclaw/pull/40175))
- **Matrix streaming** — partial replies now update in-place instead of sending a new message per chunk ([#56387](https://github.com/openclaw/openclaw/pull/56387))
- **Skills/plugins install** now fail closed on dangerous-code findings by default — a breaking change for installs that previously succeeded silently

The full changelog is available on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.3.31).
