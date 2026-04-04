---
title: "OpenClaw Gets Prompt Cache Break Diagnostics in New PR"
excerpt: "PR #60707 adds embedded-runner prompt cache observability to OpenClaw, surfacing cache reuse stats in status and emitting JSONL traces when cache breaks are detected."
coverImage: '/assets/images/posts/openclaw-2026-4-4-prompt-cache-diagnostics.png'
date: '2026-04-04T08:00:00.000Z'
dateFormatted: April 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-4-prompt-cache-diagnostics.png'
---

A new pull request merged into the OpenClaw main branch adds a long-requested developer tool: **prompt cache break diagnostics**. [PR #60707](https://github.com/openclaw/openclaw/pull/60707), contributed by [@vincentkoc](https://github.com/vincentkoc), gives power users visibility into why their prompt cache reuse rate drops — which directly affects cost and latency when using providers like Anthropic that support prompt caching.

## What Is Prompt Cache Break Diagnostics?

When OpenClaw runs a conversation through an LLM provider that supports prompt caching (such as Anthropic's Claude), the system prompt, tool definitions, and conversation prefix can be cached on the provider side. If that cache is invalidated between turns — a "cache break" — you pay to re-process those tokens and get a slower response.

Until now, diagnosing *why* a cache broke required digging through raw API logs. PR #60707 changes that.

## What the PR Adds

The PR introduces two new components:

### 1. Cache Fingerprinting Per Turn

A `beginPromptCacheObservation` / `completePromptCacheObservation` pair now runs at the start and end of each embedded-runner turn. It fingerprints the **cache-relevant inputs** for that turn — model, transport, system prompt, and tool set — and diffs them against the prior turn. If a material change is detected, a structured warning is emitted.

This means OpenClaw can now tell you: *"Your cache broke this turn because the system prompt changed."*

### 2. Verbose Status Column

A new **Cache** column appears in `openclaw /status --verbose` output, showing per-session prompt cache reuse statistics. The same `resolvePromptCacheStats` helper is shared with the compact token suffix display.

### 3. Optional JSONL Trace Events

For developers who want the raw data, setting `OPENCLAW_CACHE_TRACE=1` enables JSONL trace event output, which you can pipe to log aggregation tools or just inspect directly.

## Why This Matters

Prompt caching is one of the most effective ways to reduce API costs for long-running OpenClaw sessions. A gateway that's been running for hours with the same agent config should be achieving high cache reuse. When it isn't — often due to subtle config changes, plugin reloads, or tool registration order shifts — the cost impact compounds quickly.

This PR doesn't fix cache breaks, but it makes them **visible**, which is the first step to fixing them.

## Availability

The feature is opt-in by default (disabled unless `OPENCLAW_CACHE_TRACE` is set or debug logging is active), so it won't affect production performance. Expect it to ship in an upcoming release following the current v2026.4.2 baseline.

Keep an eye on the [OpenClaw releases page](https://github.com/openclaw/openclaw/releases) to catch it when it drops.
