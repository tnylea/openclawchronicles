---
title: "Anthropic Confirms OpenClaw-Style Claude CLI Usage Is Allowed"
excerpt: "A Hacker News post linking to OpenClaw's Anthropic provider docs hit 471 points and 268 comments as users confirmed Anthropic now explicitly permits OpenClaw-style Claude CLI access."
coverImage: '/assets/images/posts/openclaw-2026-4-21-anthropic-claude-cli-allowed.png'
date: '2026-04-21T20:00:00.000Z'
dateFormatted: April 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-21-anthropic-claude-cli-allowed.png'
---

A story posted to Hacker News late Tuesday — ["Anthropic says OpenClaw-style Claude CLI usage is allowed again"](https://news.ycombinator.com/item?id=47844269) — reached **471 points and 268 comments** within hours, making it one of the most-discussed OpenClaw threads in recent memory. The post links directly to the [OpenClaw Anthropic provider docs](https://docs.openclaw.ai/providers/anthropic), which document how OpenClaw routes requests through locally-installed Claude CLI sessions.

## What Changed

For months, a gray area existed: Anthropic's Terms of Service had language that some interpreted as restricting automated or "headless" Claude usage through third-party tools. OpenClaw's Claude CLI integration — which lets you configure `claude-cli` or `claude-p` as a provider and route agent turns through your existing Claude subscription — sat in that ambiguous zone.

The HN thread confirms that Anthropic has updated its guidance, explicitly permitting OpenClaw-style usage. The OpenClaw docs page linked in the post describes the setup in detail, and the community response has been largely celebratory: users who had been hedging or self-censoring their Claude CLI configs can now operate with confidence.

Several comments in the thread note that this unlocks a meaningful cost path. Claude Max subscribers, in particular, can now run extended OpenClaw sessions against their subscription without hitting separate API billing — the same model that Claude Code users have been operating under.

## What the Docs Say

The [OpenClaw Anthropic provider page](https://docs.openclaw.ai/providers/anthropic) covers three integration paths:

- **`anthropic` (direct API)** — Standard API key usage, billed per token
- **`claude-cli` / `claude-p`** — Routes through an installed Claude CLI binary using your existing session; requires Claude Code or Claude CLI to be installed and authenticated
- **`claude-max`** — Specifically for Claude Max subscribers who want to use subscription capacity for agent turns

The third path is what the HN discussion centers on. The docs note that Anthropic has confirmed this usage pattern is within their acceptable use policy, citing the same framework that permits Claude Code's headless `-p` flag usage.

## Why It Matters for Self-Hosters

This matters because OpenClaw's value proposition for many users is *not* paying for separate API access on top of subscriptions they already have. If you are paying for Claude Max to use Claude Code, routing your OpenClaw sessions through that same subscription is a natural extension.

The earlier ambiguity had a chilling effect. Posts across Reddit, HN, and Discord regularly included hedges like "not sure if this is allowed" or "using this at my own risk." With explicit documentation from Anthropic, those qualifications go away — and adoption of the Claude CLI provider path is likely to accelerate.

## The 268-Comment Thread

The discussion itself is worth reading. Beyond the main question of permission, commenters dig into:

- **What "allowed" actually means** in practice for different account tiers
- **How OpenClaw's request routing compares to Claude Code's `-p` path** (they are architecturally similar)
- **Whether Anthropic could reverse this position** and what signals to watch for
- **Comparisons to OpenBridge**, a separate Show HN that surfaced on the same day ([#47845540](https://news.ycombinator.com/item?id=47845540)), which takes a more aggressive approach to web-session scraping that some commenters view as risker territory

The consensus in the thread is that OpenClaw's approach — working through the official CLI binary with an authenticated session — is meaningfully different from browser-session scraping, and that Anthropic's guidance reflects that distinction.

## Setting Up the Claude CLI Provider

If you want to try this, the setup is straightforward:

```bash
# Install Claude CLI if you haven't
npm install -g @anthropic-ai/claude-code

# In your OpenClaw config, add:
# providers:
#   - id: claude-cli
#     type: claude-cli
```

Full configuration options, including how to set a specific Claude binary path and configure timeout behavior, are in the [OpenClaw Anthropic provider docs](https://docs.openclaw.ai/providers/anthropic).
