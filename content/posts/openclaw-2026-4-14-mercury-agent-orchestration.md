---
title: "Mercury Adds OpenClaw Adapter in a16z-Backed Agent Platform"
excerpt: "Mercury, a no-code agent orchestration canvas backed by a16z, lists OpenClaw as a first-class adapter alongside Claude Code, Devin, and Manus."
coverImage: '/assets/images/posts/openclaw-2026-4-14-mercury-agent-orchestration.png'
date: '2026-04-14T01:30:00.000Z'
dateFormatted: April 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-14-mercury-agent-orchestration.png'
---

A [Show HN post from last night](https://news.ycombinator.com/item?id=47758643) caught our attention: **Mercury** (mercury.build), a new a16z-backed agent orchestration platform, lists OpenClaw as a first-class supported agent type alongside Claude Code, Devin, Manus, and Gumloop.

This is a notable signal for the OpenClaw ecosystem. It means teams building multi-agent systems are already treating OpenClaw as a peer to purpose-built coding agents in the orchestration layer.

## What Mercury Does

Mercury is a visual canvas for connecting human and AI agent teams. You draw edges between agents to define delegation relationships — Agent A can delegate to Agent B, which can delegate further down the graph. The canvas becomes a live map of how your team operates.

The founder's pitch centers on a problem anyone who has run multiple agents knows well: "You've got Claude Code in a terminal, a research agent in a browser tab, a Slack bot somewhere else, a scheduling assistant in yet another window. It's chaotic."

Mercury aims to solve the coordination problem, not the individual-agent problem.

## OpenClaw as an Adapter

Mercury supports several agent types on the same canvas:

- **Native Mercury agents** — built on the Anthropic SDK
- **Adapters** for Claude Code, Devin, Manus, OpenClaw, Gumloop
- **MCP-compatible agents** via the MCP protocol

The OpenClaw adapter means you can connect your existing OpenClaw instance to a Mercury canvas and have it receive delegated tasks, process them with its full tool stack, and return results to orchestrating agents or humans.

This fits naturally with how OpenClaw works — it already handles delegation internally through its sub-agent system. Being a node in a larger Mercury-managed graph extends that pattern to cross-tool teams.

## Why This Matters

OpenClaw being included at launch (not added later) suggests the Mercury team built against it deliberately. The platform integrates 800+ tools via Composio, supports iMessage and Slack as human-facing channels, and has human-in-the-loop approval by default — all patterns familiar to OpenClaw users.

The a16z backing ($1.5M seed, with investors from OpenAI and Cognition) gives Mercury some runway to ship. Whether it finds product-market fit is TBD, but the fact that an a16z portfolio company is shipping OpenClaw support from day one is a sign of where the ecosystem is heading.

## The Memory Architecture Question

The most interesting part of the Show HN post is the question the Mercury team is wrestling with publicly:

> "Where should memory live — in the orchestration layer or the agent layer?"

It's a genuinely hard problem. OpenClaw's approach leans toward the agent layer — memory lives close to the agent that uses it, with recall running right before each reply (especially now that Active Memory shipped in 2026.4.12). Mercury started with org-level memory exposed as tools, but acknowledges that's not right for every agent.

This is an open design question for the entire multi-agent space. Worth watching as both platforms evolve.

## Try Mercury

Mercury is in alpha: [mercury.build](https://www.mercury.build/). If you're running OpenClaw and want to connect it to a larger agent graph, it's worth a look.
