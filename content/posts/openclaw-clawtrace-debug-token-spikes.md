---
title: "ClawTrace: Visualize and Debug Your OpenClaw Agent Runs"
excerpt: "ClawTrace is an open-source OpenClaw plugin that records every agent run as a trace tree, helping you catch token spikes, tool loops, and runaway costs."
coverImage: '/assets/images/posts/openclaw-clawtrace-debug-token-spikes.png'
date: '2026-04-14T23:00:00.000Z'
dateFormatted: April 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-clawtrace-debug-token-spikes.png'
---

The origin story is painfully relatable. An OpenClaw agent burned roughly 40 times its normal token budget in under an hour. Root cause: it was appending around 1,500 messages of history to every LLM call. By the time the operator noticed, a task that should have cost three cents had already consumed several dollars — and there was nothing in the logs to catch it.

That incident prompted Epsilla Cloud to build **[ClawTrace](https://github.com/epsilla-cloud/clawtrace)** — an open-source OpenClaw plugin and accompanying web UI that turns every agent run into an inspectable tree of spans. It showed up on Hacker News today ([Show HN #47769889](https://news.ycombinator.com/item?id=47769889)).

## What ClawTrace Records

The `@epsilla/clawtrace` plugin hooks into eight OpenClaw event types:

- `session_start` / `session_end`
- `llm_input` / `llm_output`
- `before_tool_call` / `after_tool_call`
- `subagent_spawning` / `subagent_ended`

Every event is batched and streamed to ClawTrace's ingest service, then materialized via a Databricks Lakeflow SQL pipeline into Iceberg tables and exposed as a Cypher-queryable graph via PuppyGraph. The frontend renders three views for every trace:

- **Execution path** — a collapsible tree with parent-child relationships and per-node cost badges
- **Call graph** — a force-directed diagram of every agent, model, and tool
- **Timeline** — a Gantt chart showing where time actually went

Click any node to see the full input/output payload, token counts, duration, and cost.

## Tracy: Ask Questions About Your Own Agent

The standout feature is **Tracy**, an AI analyst wired directly to the trajectory graph via MCP. Instead of reading logs, you ask questions in plain English:

- *"Why did my last run cost so much?"*
- *"Which tool is failing most often?"*
- *"Is my context window growing across sessions?"*

Tracy runs live Cypher queries against your data, generates charts, and returns specific answers. The ClawTrace Self-Evolve skill takes this further — install it and your agent will periodically review its own cost and failure patterns, apply fixes, and log what it changed.

## Installation

```bash
openclaw plugins install @epsilla/clawtrace
openclaw clawtrace setup
openclaw gateway restart
```

Paste your observe key from [clawtrace.ai](https://clawtrace.ai) when prompted. New accounts get 200 free credits and no credit card is required.

## Architecture in Brief

The stack is: OpenClaw plugin → FastAPI ingest → Databricks Delta Lake → PuppyGraph → FastAPI backend → Next.js 15 UI. Cost estimates support 80+ models with cache-aware pricing across OpenAI, Anthropic, Google, DeepSeek, Mistral, and a range of Chinese models (Qwen, GLM, Kimi, ERNIE) and open-source models (Llama 4/3.x, Mixtral).

## Why This Matters

OpenClaw's built-in logs are useful but they flatten everything into JSON blobs with no execution graph. When agents spawn sub-agents, call tools in loops, or hit context growth issues, root-causing from flat logs is tedious. ClawTrace gives you the observability layer that has been missing from the OpenClaw ecosystem — and the full source is on GitHub under Apache 2.0.

If you have ever shipped an agent to production and later wondered "what exactly did it do," this is worth installing.
