---
title: "OpenClaw Fixes Prompt Cache Churn Caused by HEARTBEAT.md"
excerpt: "PR #61236 reorders project context injection so HEARTBEAT.md sits below the cache boundary, preventing heartbeat updates from invalidating your stable prompt cache prefix."
coverImage: '/assets/images/posts/openclaw-2026-4-5-prompt-cache-heartbeat-ordering.png'
date: '2026-04-05T08:00:00.000Z'
dateFormatted: April 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-5-prompt-cache-heartbeat-ordering.png'
---

A small but impactful pull request merged into OpenClaw this week puts an end to a frustrating source of prompt cache waste: **heartbeat churn breaking your stable context prefix**. [PR #61236](https://github.com/openclaw/openclaw/pull/61236), contributed by [@vincentkoc](https://github.com/vincentkoc) with input from [@yozu](https://github.com/yozu), fixes the ordering of injected workspace files so that frequently-changing files like `HEARTBEAT.md` no longer sit above the cache boundary and invalidate the tokens you're trying to cache.

## Why Prompt Cache Ordering Matters

Providers like Anthropic's Claude and OpenAI's Codex support **prompt caching** — a mechanism where a stable prefix of your system prompt (tools, instructions, project context) gets cached on the provider's servers. Subsequent requests that share that prefix skip re-processing those tokens, meaning **faster responses and lower costs**.

The catch: the cache is prefix-based. If *anything* earlier in the prompt changes, the cache is busted and you pay full price to re-process every token in front of it.

OpenClaw injects several workspace files into the system prompt automatically — `SOUL.md`, `USER.md`, `AGENTS.md`, project files, and the dynamic `HEARTBEAT.md` checklist. Before this fix, `HEARTBEAT.md` could appear before stable project context files, meaning every heartbeat run (which modifies `HEARTBEAT.md`) would silently bust the cache for all the stable content that followed.

## What PR #61236 Changes

The fix enforces a deliberate injection order:

1. **Stable workspace project-context files** (e.g. `SOUL.md`, `USER.md`, `AGENTS.md`, `TOOLS.md`, custom project files) — injected first, above the cache boundary
2. **`HEARTBEAT.md`** — moved below the cache boundary, so its frequent updates don't invalidate the stable prefix

This is a deceptively simple change with meaningful real-world impact. On a typical OpenClaw setup with heartbeat polling every 30 minutes, this fix can dramatically improve cache hit rates over the course of a day — translating directly to lower API bills and snappier response times.

## Who Does This Affect?

This fix benefits anyone who:

- Uses **heartbeat mode** (the periodic background polling that checks emails, calendars, reminders, etc.)
- Has configured a provider with prompt caching support (Anthropic Claude, OpenAI with caching enabled, Codex Responses API)
- Has a non-trivial amount of stable workspace context (project docs, persona files, tool notes)

If you're running OpenClaw on Anthropic Claude with a well-populated workspace, you've likely been paying the cache-miss penalty on every heartbeat run without knowing it. This fix stops that.

## Also in This PR: Copilot and BytePlus Improvements

PR #61236 bundles a few other polish items:

- **GitHub Copilot**: IDE identity headers (`Editor-Version`) are now sent on runtime model requests and token exchange flows, fixing authentication failures for IDE-authenticated Copilot sessions (related to [#60641](https://github.com/openclaw/openclaw/pull/60641), thanks [@VACInc](https://github.com/VACInc))
- **BytePlus / Volcengine model picker**: bundled plan aliases now map to their native providers during setup, so the model picker shows the correct catalog before auth is complete (thanks [@Luckymingxuan](https://github.com/Luckymingxuan))
- **Prompt cache tracing**: Codex Responses and Anthropic Vertex paths now route through boundary-aware cache shaping and report the actual outbound system prompt in cache traces — so when you investigate a cache miss, the trace matches what the provider actually received

## How to Get It

PR #61236 has merged into `main`. It will ship in the next OpenClaw release. If you want it immediately, build from main or watch the [releases page](https://github.com/openclaw/openclaw/releases) for the next tagged version.

No configuration changes required — the ordering fix is automatic. Your `HEARTBEAT.md` stays where it is; OpenClaw just injects it more intelligently.

---

For the full diff and discussion, see [PR #61236 on GitHub](https://github.com/openclaw/openclaw/pull/61236).
