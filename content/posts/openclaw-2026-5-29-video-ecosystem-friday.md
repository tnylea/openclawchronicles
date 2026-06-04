---
title: "OpenClaw Friday: Earning With Agents and a Team Agent Framework"
excerpt: "This week's OpenClaw video roundup covers monetizing AI agents, plus Heypi — a new Show HN that brings OpenClaw-style skills and approvals to team Slack and Discord bots."
coverImage: '/assets/images/posts/openclaw-2026-5-29-video-ecosystem-friday.webp'
date: '2026-05-29T23:00:00.000Z'
dateFormatted: May 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-29-video-ecosystem-friday.webp'
---

Friday is the best day to catch up on OpenClaw content outside the changelog — tutorials, experiments, and community tools that don't show up in release notes. This week there's a useful YouTube deep-dive and a new Show HN that the team-agent space should pay attention to.

## 🎥 "Every Way to Make Money With OpenClaw" — Youri van Hofwegen

**[Watch on YouTube →](https://www.youtube.com/watch?v=DojCf6noL18)**

Youri van Hofwegen's latest is a systematic breakdown of monetization paths for OpenClaw users and builders. The video covers the major categories people are actually using right now — hosted agent services, freelance automation work, building tools on top of OpenClaw's SDK, and productized agent packages.

It's a practical survey rather than a get-rich-quick piece. If you've been running OpenClaw seriously and wondered whether there's a business model in it, this is a grounded starting point. Van Hofwegen's framing is builder-first: what skills and infrastructure do you actually need, and what does the market currently pay for each approach.

Timestamp-friendly content if you want to jump to specific paths rather than watching linearly.

## 🛠️ Show HN: Heypi — OpenClaw-Style Agents for Teams

Posted to Hacker News today: **[Heypi](https://github.com/hunvreus/heypi)**, described by its author as "like OpenClaw but for teams."

It's a TypeScript framework — built on the Pi runtime — for deploying chat agents to Slack, Discord, Telegram, and webhooks with proper team-safety features:

- **Sandboxed command execution** — just-bash, Docker, or Gondolin runtimes
- **Approval flows** — risky commands require sign-off from a designated team
- **Markdown-based configuration** — SOUL.md and AGENTS.md, mirroring OpenClaw's conventions
- **Web admin panel and audit trail**
- **Document support** (PDF, docx, etc.)
- **Cron and heartbeat** scheduling

The repo ships with three ready-to-use examples:
- `examples/slack-devops` — a Slack DevOps assistant with SSH tools, runbook search, and approval gates
- `examples/discord-project` — a project assistant with streaming and approval flows
- `examples/telegram-workout` — a fitness coach with daily heartbeat check-ins

The choice to mirror OpenClaw's SOUL.md and AGENTS.md conventions is smart — it means anyone who already knows how to configure an OpenClaw agent has most of the mental model they need for Heypi. The main difference is that Heypi is explicitly multi-user from the start, with team-scoped approval flows rather than single-user authorization.

Pi extensions are supported (with some caveats), and the author notes it's early — stability labels on the packages range from "Early" (core runtime) to "Experimental" (Docker and Gondolin runtimes).

**GitHub:** [github.com/hunvreus/heypi](https://github.com/hunvreus/heypi) — MIT licensed, pnpm workspace. HN discussion: [story 48327336](https://news.ycombinator.com/item?id=48327336).

---

## The Week in Context

The theme across this week's community content is OpenClaw leaving the solo-developer niche. HolaClaw is targeting mainstream Mac users who never opened a terminal. Heypi is targeting teams who want agent infrastructure but need safety guardrails baked in. And monetization content is appearing — which usually signals that a tool has reached the point where people are making real money with it.

The core project is keeping pace: tonight's v2026.5.28-beta.4 adds Claude Opus 4.8, GitHub Copilot runtime, and a Workboard for multi-agent coordination. The platform is clearly in a growth phase.
