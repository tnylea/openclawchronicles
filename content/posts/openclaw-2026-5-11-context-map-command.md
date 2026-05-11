---
title: "OpenClaw's New /context map Command Shows What Is Eating Your Context Window"
excerpt: "The new /context map command in OpenClaw renders a treemap image showing exactly which session contributors are consuming your AI model's context window."
coverImage: '/assets/images/posts/openclaw-2026-5-11-context-map-command.png'
date: '2026-05-11T08:05:00.000Z'
dateFormatted: May 11th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-11-context-map-command.png'
---

Buried in the v2026.5.10-beta.3 release notes is one of the most practically useful features OpenClaw has shipped in a while: **`/context map`**.

## What It Does

The `/context map` command renders a **treemap image** of the current session's context contributors and sends it directly into your chat window. System prompts, skill files, memory, conversation history, tool schemas — each one appears as a proportionally sized block, giving you an instant visual breakdown of what's filling your model's context window.

Importantly, the image is generated from actual run context, not estimates. The release notes are explicit: "render /context map only from actual run context." What you see reflects what's really loaded in the current turn.

## Why This Matters

Context window management is one of the trickier aspects of running production OpenClaw agents. Long-running sessions accumulate history, loaded skills add token overhead, and large memory files can quietly consume thousands of tokens before the agent starts on your actual request.

Before `/context map`, diagnosing context bloat meant enabling verbose logging and parsing dense diagnostic output — or watching compaction kick in earlier and earlier without knowing why. Now you can just type a command and see the picture.

If your `MEMORY.md` is consuming 40% of the context window, it'll be immediately obvious. Same for oversized skill files, bloated system prompts, or session history that's grown stale. The visual format makes comparisons intuitive in a way raw token counts never quite manage.

## How to Use It

In any OpenClaw session — CLI, Discord, Slack, Telegram, or wherever your agent lives — run:

```
/context map
```

OpenClaw generates the treemap from the current session context and delivers it inline. No configuration required. It's available today in `v2026.5.10-beta.3`.

## Codex Integration

The beta.3 release also wires `/context map` correctly into the Codex app-server. Codex-native tool execution is now reported to diagnostics, which means the context map correctly excludes deferred tool-search schemas from the prompt-loaded tool count. You see an accurate picture of what the model has actually received, not what's theoretically available on demand.

## Practical Uses

A few ways this can improve daily OpenClaw use:

- **Before long coding sessions**: Run `/context map` at the start to see your baseline footprint and plan around compaction thresholds.
- **After loading new skills**: Compare context before and after to understand the real token cost of a skill.
- **Debugging slow responses**: A packed context window often explains slower outputs on latency-sensitive providers; the map gives you evidence to act on.
- **Optimizing MEMORY.md**: If your long-term memory file is oversized, the treemap makes that obvious at a glance.
- **Multi-agent setups**: In complex agent configurations, `/context map` helps identify which tools and session handoffs are contributing the most overhead.

It's a small addition in terms of lines of code, but the observability gain is significant. Context window management goes from something you feel around for in the dark to something you can actually see.

The full release is on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.10-beta.3). See [PR #79867](https://github.com/openclaw/openclaw/pull/79867) for the implementation details.
