---
title: "OpenClaw Leads the ARC-AGI-3 Community Leaderboard at 5.2%"
excerpt: "An OpenClaw-based agent harness has claimed the top spot on the official ARC-AGI-3 community leaderboard, scoring 5.2% for $2,912 using memory and code tools."
coverImage: '/assets/images/posts/openclaw-2026-5-21-arc-agi-3-leaderboard.png'
date: '2026-05-21T23:00:00.000Z'
dateFormatted: May 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-21-arc-agi-3-leaderboard.png'
---

OpenClaw is now sitting at **#1 on the official ARC-AGI-3 community leaderboard** — the benchmark designed by François Chollet's ARC Prize Foundation to measure genuine fluid intelligence in AI systems. The submission, listed simply as "OpenClaw," scored **5.2%** on the benchmark at a total compute cost of **$2,912**, with a run date of May 15, 2026.

## What ARC-AGI-3 Is

ARC-AGI (Abstraction and Reasoning Corpus) is widely considered one of the harder tests of AI reasoning that can't be easily gamed by scale alone. The third generation — ARC-AGI-3 — pushed the difficulty further, and the human baseline sits at **95.3%**, which puts the 5.2% OpenClaw result in context: it's a first position on the community board, but there's a long road ahead.

That said, landing the top community slot with an agent harness rather than a purpose-built model is notable. The entry description reads:

> *"OpenClaw Harness adapted to play ARC-AGI-3 allowed memory and code execution tools."*

The ARC Prize Foundation published the [full code](https://github.com/arcprize/ARC-AGI-3-Agents/tree/main/agents/templates/openclaw_agent) and a [scorecard](https://arcprize.org/scorecards/4793f52c-ae2a-4622-a7e1-a84b06218c97) alongside the leaderboard entry.

## Why This Matters

ARC-AGI-3 submissions from the community have historically come from purpose-built systems — evolutionary search algorithms, fine-tuned models, or domain-specific solvers. Seeing an out-of-the-box agent harness like OpenClaw compete on the same benchmark, using memory and code execution as its primary tools, signals something interesting about where general-purpose agents are heading.

The submission also validates OpenClaw's long-held design philosophy: a capable agent shouldn't need task-specific scaffolding to reason about novel problems. It should be able to use the tools it already has — code execution, memory — and get somewhere.

## The Competition

The next entries on the ARC-AGI-3 board include a "Read-Grep-Bash Agent" from researchers at Duke and other institutions, whose score is still pending a full public-set run. Below that, the leaderboard shifts to ARC-AGI-2 entries from 2025.

## Contribute or Replicate

The agent template is open source under the ARC Prize Foundation's repository. If you want to run your own OpenClaw agent against ARC-AGI-3, the template is a reasonable starting point. The benchmark itself is available at [arcprize.org](https://arcprize.org).
