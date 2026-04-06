---
title: "Anthropic Cuts Off OpenClaw Claude Access Without Extra Fees"
excerpt: "As of April 4, Anthropic blocked Claude Pro and Max subscribers from using OpenClaw without paying separately under a new extra usage billing system."
coverImage: '/assets/images/posts/openclaw-2026-4-6-anthropic-claude-extra-fees.png'
date: '2026-04-06T23:00:00.000Z'
dateFormatted: April 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-6-anthropic-claude-extra-fees.png'
---

If you're running OpenClaw with a Claude Pro or Max subscription, your setup just changed. As of April 4, 2026, Anthropic has blocked subscribers from using their included credits through third-party frameworks like OpenClaw. You can still technically use the tool, but you'll now pay separately under Anthropic's new "extra usage" billing tier.

## What Anthropic Actually Said

Anthropic's Boris Cherny, head of Claude Code, addressed the move directly. The subscriptions "weren't built for the usage patterns of these third-party tools," he wrote on X. "Capacity is a resource we manage thoughtfully, and we are prioritizing our customers using our products and API."

Cherny was careful to frame this as an engineering constraint rather than an ideological move, adding that Anthropic is a "big fan of open source." The policy currently targets OpenClaw but is expected to roll out to other third-party integrations in the coming weeks.

## Peter Steinberger Pushes Back

OpenClaw's creator, Peter Steinberger — who joined OpenAI in February — didn't hold back. In a reply on X, he wrote: "Anthropic seems to hate open source and blocked us (unless you pay a lot), OpenAI supports the subscription officially."

That's a pointed statement from someone whose previous tool was built primarily around Claude. It also signals a likely shift in OpenClaw's default provider recommendations toward OpenAI's API going forward.

## What This Means for OpenClaw Users

Here's the practical breakdown:

- **Claude Pro/Max subscribers**: Your existing credits no longer cover OpenClaw usage. You'll need to set up separate API billing under Anthropic's "extra usage" plan, or switch providers.
- **API key users (pay-as-you-go)**: You're unaffected. The restriction targets subscription credits, not direct API access.
- **OpenAI users**: No change. OpenAI continues to officially support third-party framework usage under standard subscriptions.
- **Local model users (Ollama, etc.)**: Completely unaffected.

## A Shifting Ecosystem

This move matters beyond just billing. OpenClaw's rapid growth — now powering hundreds of thousands of self-hosted agent installations — means any major provider policy shift creates real friction for a large user base.

The timing is notable: OpenClaw's changelog for v2026.4.5 (released April 6) already removed the Claude CLI backend from new onboarding flows and deprecated the `anthropic:claude-cli` profile. Whether that's coincidence or an accelerated migration is unclear, but the direction is hard to miss.

For users who want to keep using Claude, the path forward is straightforward: switch from a Pro/Max subscription to API key billing. The [Anthropic API pricing page](https://www.anthropic.com/pricing) has current rates. For heavy agentic workloads, API billing can actually be more cost-effective than subscription credits anyway.

For users open to switching, OpenClaw's provider support is broad. The v2026.4.5 release added bundled support for Qwen, Fireworks AI, StepFun, and expanded Amazon Bedrock integrations — plenty of alternatives to Claude in the mix.

## The Bigger Picture

This is the second major cloud provider friction moment for OpenClaw in its short life (the first being the forced name change from Clawdbot, which Anthropic also drove). It's a reminder that building a free, open-source agent runtime on top of paid API infrastructure comes with real dependencies — and that providers will enforce their terms when usage patterns deviate from what subscriptions were designed for.

The OpenClaw community is actively discussing alternatives on [r/openclaw](https://www.reddit.com/r/openclaw/) and [r/openclawsetup](https://www.reddit.com/r/openclawsetup/). The short version: don't panic, just update your config.
