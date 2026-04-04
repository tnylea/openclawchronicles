---
title: "Anthropic Drops OpenClaw from Claude Subscriptions Starting Today"
excerpt: "Anthropic announced Claude subscriptions will no longer cover OpenClaw usage as of April 4, 2026, pushing users to a separate pay-as-you-go API plan."
coverImage: '/assets/images/posts/openclaw-2026-4-4-anthropic-claude-drops-openclaw-support.png'
date: '2026-04-04T08:00:00.000Z'
dateFormatted: April 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-4-anthropic-claude-drops-openclaw-support.png'
---

In a move that caught many users off guard, Anthropic has announced that Claude subscriptions will no longer support usage through third-party tools like OpenClaw, effective **today, April 4, 2026 at 12 PM Pacific Time**. Users who want to continue using Claude as their OpenClaw provider will need to switch to a pay-as-you-go API plan.

## What Anthropic Said

Boris Cherny, Anthropic's Head of Claude Code, announced the change on X, framing it as a capacity management decision:

> "We've been working hard to meet the increase in demand for Claude, and our subscriptions weren't built for the usage patterns of these third-party tools. Capacity is a resource we manage thoughtfully, and we are prioritizing our customers using our products and API."

Anthropic is offering a one-time credit equal to your current monthly plan cost to soften the transition. The change goes live at noon PT today.

## OpenClaw Creator Responds

OpenClaw creator Peter Steinberger reacted publicly on X, noting that he and OpenClaw board member Dave Morin had attempted to negotiate with Anthropic, but the most they could secure was a one-week delay:

> "Woke up and my mentions are full of this. Both me and @davemorin tried to talk sense into Anthropic, best we managed was delaying this for a week. Funny how timings match up, first they copy some popular features into their closed harness, then they lock out open source."

The timing is notable. Anthropic has been shipping competing agentic features of its own — including Claude Cowork, Dispatch, and Channels — all of which overlap with OpenClaw's core value proposition of connecting AI to messaging apps like WhatsApp, Telegram, and Discord.

## What This Means for OpenClaw Users

If you currently rely on Claude via a Claude Pro or Claude Max subscription to power OpenClaw, **you will need to act before noon PT today**:

- **Option A — Switch to Anthropic API:** Sign up for Anthropic API access at [console.anthropic.com](https://console.anthropic.com) and set your `ANTHROPIC_API_KEY` in OpenClaw. You'll be billed on a pay-per-token basis. Most moderate personal-use setups cost a few dollars per month at API rates.
- **Option B — Switch providers:** OpenClaw supports a wide range of alternative providers — Google Gemini, OpenAI, xAI (Grok), Amazon Bedrock, Ollama, and more. Switching is a single config change in `~/.openclaw/openclaw.json`.
- **Option C — Wait and see:** OpenClaw's open-source community may negotiate further or find workarounds. Watch the [GitHub discussions](https://github.com/openclaw/openclaw/discussions) for updates.

## The Bigger Picture

This move is a sharp reminder of the risk of coupling an open-source self-hosted tool to a commercial subscription model. OpenClaw's architecture was always designed to be provider-agnostic, and this moment underscores why that flexibility matters.

Steinberger's hire by OpenAI — announced earlier this year — also adds an interesting dimension: the OpenClaw creator now works for one of Anthropic's direct competitors, and Claude's subscription lockout effectively nudges the OpenClaw community toward the OpenAI API ecosystem.

For now, **the simplest short-term fix is to grab an Anthropic API key** and swap out your config. Long-term, this is a good prompt to explore OpenClaw's multi-provider failover features — including `auth.failover` model chains that can automatically fall back to a secondary provider if the primary is unavailable.

Check the [OpenClaw docs on providers](https://docs.openclaw.ai) for a full walkthrough on switching.
