---
title: "OpenClaw Creator Spent $1.3M on OpenAI Tokens in 30 Days"
excerpt: "Peter Steinberger revealed he spent $1.3M on OpenAI tokens in 30 days powering OpenClaw. HN erupted with 144 comments on the economics of running AI agents at scale."
coverImage: '/assets/images/posts/openclaw-2026-5-16-token-spend.webp'
date: '2026-05-16T23:05:00.000Z'
dateFormatted: May 16th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-16-token-spend.webp'
---

OpenClaw creator Peter Steinberger (@steipete) dropped a number today that sent Hacker News into a frenzy: he spent **$1.3 million on OpenAI tokens in a single 30-day period** powering OpenClaw's development and operations.

The [original tweet](https://twitter.com/steipete/status/2055346265869721905) surfaced on Hacker News this morning as story [#48159227](https://news.ycombinator.com/item?id=48159227), where it climbed to **133 points and 144 comments** — one of the most-discussed OpenClaw stories in weeks.

## What $1.3M in Tokens Looks Like

At current OpenAI API pricing, $1.3 million over 30 days works out to roughly $43,000 per day. That figure puts into perspective the compute demands of running a large-scale personal AI agent platform. OpenClaw is not a hobby project serving a handful of users; it is a system that Steinberger runs heavily in his own life, uses as the primary environment for developing OpenClaw itself, and eats its own dog food aggressively at every layer.

The disclosure is a rare moment of financial transparency from an open-source AI agent developer. Most projects of this scale quietly absorb token costs or spread them across enterprise customers without ever surfacing a number.

## The HN Thread

The Hacker News discussion covered several distinct angles:

**Sticker shock vs. context.** Many commenters noted that $1.3M for a platform used by tens of thousands of people — and developed heavily using the platform itself — looks very different on a per-seat basis. The raw number is dramatic; the economics are more nuanced.

**Model alternatives.** Several threads explored whether the same workload could run significantly cheaper on open-weight models or OpenRouter-routed alternatives. OpenClaw's built-in support for OpenRouter, local models via Ollama, and xAI (which just gained native Grok OAuth in [today's beta releases](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.3)) makes model substitution a live option for cost-conscious operators.

**The Anthropic credit pool timing.** Steipete's disclosure landed the same week Anthropic announced a separate monthly credit pool for programmatic Claude usage — a policy that directly affects OpenClaw users running Claude via subscription. The timing was not lost on the thread. One commenter described it as "two OpenClaw-shaped problems arriving at the same time."

**OpenRouter leaderboard context.** Earlier this week, HN also noted that [Hermes Agent surpassed OpenClaw as the top app on OpenRouter's leaderboard](https://openrouter.ai/rankings) — a signal that token costs and model flexibility are increasingly competitive differentiators in the personal agent space.

## Why This Matters

OpenClaw's development trajectory has always been eat-your-own-dogfood-first. Knowing the creator is running $1.3M per month in tokens through the platform tells you two things clearly: the system is genuinely production-capable at scale, and token cost optimization is likely to become a first-class feature priority in upcoming releases.

The project already ships aggressive efficiency tooling. Today's beta.3 caches `resolvedSkills` across warm gateway turns ([#81451](https://github.com/openclaw/openclaw/pull/81451)) and includes context compaction improvements for Codex app-server sessions. The pressure on the token-efficiency story is only going to intensify.

## What to Watch

The discussion thread is worth reading in full. The economic and architectural debate happening at [news.ycombinator.com/item?id=48159227](https://news.ycombinator.com/item?id=48159227) represents some of the sharpest community commentary on AI agent operating costs to date. If you run OpenClaw at any meaningful scale, the thread will either validate your own cost experiences or give you a useful benchmark to aim for.
