---
title: "BetterClaw Enforces OpenClaw Workflows at Runtime, Not Just in Prompts"
excerpt: "BetterClaw compiles plain-English paragraphs into directed workflow graphs that block OpenClaw agents from calling tools outside their declared scope."
coverImage: '/assets/images/posts/openclaw-2026-5-1-betterclaw-workflow-enforcement.webp'
date: '2026-05-01T23:10:00.000Z'
dateFormatted: May 1st 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-1-betterclaw-workflow-enforcement.webp'
---

A new open-source tool called [BetterClaw](https://github.com/jfan22/BetterClaw) puts a runtime enforcement layer between OpenClaw agents and their tools — turning English workflow descriptions into directed graphs that actually block out-of-scope tool calls instead of just politely suggesting the agent behave.

The project surfaced on Hacker News today as a Show HN. It was built directly in response to the PocketOS incident from April 25, where a Cursor agent running Claude deleted a company's entire production database in nine seconds and then deleted the backups.

## The Core Problem

System prompts are advisory. "Don't delete the database" lives in the same instruction block as "be helpful and proactive," and when the LLM weighs those against an ambiguous situation, the helpful impulse can win. There is no second layer that makes the tool call structurally impossible.

BetterClaw is that second layer.

## How It Works

You write a workflow description in plain English:

```
Investigate the credential mismatch — read the config, test the connection, 
report findings. Do not modify or delete anything.
```

BetterClaw's CLI sends that paragraph to Claude, which compiles it into a directed graph of nodes. Each node declares exactly which tools are allowed at that step. The output is a Mermaid diagram you can inspect and approve.

Once you approve, a plugin hooks into OpenClaw's `before_tool_call` lifecycle. Any tool call outside the current node's allowlist returns a deviation error before it dispatches. The agent reads the error, sees which tools are actually allowed, and recovers — no human intervention required.

The demo in the repo reproduces the PocketOS-Railway incident with a mock Railway server. The agent tries `railway_delete_volume`. The hook fires. The volume is never touched.

## What Gets Blocked and What Gets Approved

BetterClaw supports three modes per tool in the workflow graph:

- **Allowed** — dispatches immediately
- **Blocked** — returns a deviation error; the agent must use an allowed alternative
- **Requires approval** — queues the call, blocks dispatch, sends you a notification

The approval flow is designed for genuinely sensitive operations. In the customer support walkthrough in the README, a Claude agent that wants to issue a 20% discount triggers an approval gate — the call is paused, a Slack notification fires to `#cx-escalations`, and the manager can approve (at a different percentage), deny, or let it expire. The 20% never hits production.

## Snap-Back-on-Deviation in Practice

The README documents a live run on Windows with Claude Desktop. The agent tried `ToolSearch` first — not in the compiled workflow. BetterClaw blocked it and surfaced the allowed alternative: `mcp__claude_ai_Gmail__search_threads`. The agent switched tools and completed the task without any manual intervention.

That is the key behavior: deviation is not a crash, it is a recoverable signal. The agent reads the structured error, picks a valid path, and continues.

## Audit Log

Every tool call — allowed, blocked, approved, or denied — lands in a local JSONL log at `~/.betterclaw/run.jsonl`. The CLI ships with `betterclaw view` for static post-hoc replay and `betterclaw view --watch` for a live browser view that re-polls every 500ms during a run.

At v0.3 this is local-only. A cloud tier with hash-chained audit logs, SSO, and compliance export is on the roadmap, gated on V1 signal.

## Runtime Support

BetterClaw currently supports OpenClaw and Claude Desktop (Cowork). The plugin registers two native OpenClaw hooks — `before_tool_call` and `before_prompt_build` — using the hook system that shipped in [OpenClaw 2026.4.24](https://github.com/openclaw/openclaw/releases). LangGraph and the Claude Agent SDK are next on the roadmap.

Install via npm:

```bash
npm install -g @betterclaw-ai/cli @betterclaw-ai/plugin-openclaw
```

The project is Apache 2.0 licensed and available at [github.com/jfan22/BetterClaw](https://github.com/jfan22/BetterClaw). Current version is v0.3.19, verified end-to-end on Linux, macOS, and Windows.
