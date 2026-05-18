---
title: "OpenClaw Adds xAI Grok OAuth Login for SuperGrok Subscribers"
excerpt: "SuperGrok subscribers can now authenticate xAI models in OpenClaw via OAuth — no XAI_API_KEY required. Here is how the new login flow works."
coverImage: '/assets/images/posts/openclaw-2026-5-17-xai-grok-oauth-supergrok.png'
date: '2026-05-17T08:00:00.000Z'
dateFormatted: May 17th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-17-xai-grok-oauth-supergrok.png'
---

If you are a [SuperGrok](https://x.ai/supergrok) subscriber, OpenClaw **v2026.5.16-beta.4** brings a much smoother authentication path: you can now log in to xAI directly through OAuth, skipping the API key copy-paste entirely.

## The Old Way vs. The New Way

Previously, using `xai/*` models in OpenClaw required generating an `XAI_API_KEY` from the xAI console, copying it, and pasting it into your OpenClaw config. It worked, but it created friction — particularly for SuperGrok subscribers who already pay for xAI access through their subscription and should not need to juggle API credentials on top of that.

With beta.4, SuperGrok subscribers can authenticate via xAI Grok OAuth login. The flow mirrors how OpenClaw already handles other OAuth-backed providers like Anthropic (via Claude.ai) and GitHub Copilot.

## What Gets Unlocked

The OAuth login covers:

- **`xai/*` models** — Grok models routed through xAI's API
- **xAI media providers** — image and video generation endpoints
- **xAI tool providers** — any xAI-backed tools registered in OpenClaw

If you have a SuperGrok subscription, all of these now authenticate from a single OAuth login session — no `XAI_API_KEY` in your config file.

## How to Set It Up

Once you are on beta.4, run:

```bash
openclaw configure
```

Navigate to the Providers section and select **xAI**. You will see the new OAuth login option alongside the existing API key path. Choose OAuth, follow the browser prompt, and you are done. OpenClaw stores the OAuth credential in your auth profile using the same serialization path as other OAuth providers, with write-lock protection to prevent credential overwrites from stale in-memory snapshots.

## Why This Matters Beyond Convenience

The shift to OAuth is not just about removing a copy-paste step. API keys are static credentials that can be leaked, rotated with service interruption, and accidentally committed to version control. OAuth tokens are session-scoped, revocable, and tied to your xAI account identity — a meaningfully better security posture for a credential that authorizes inference spend.

OpenClaw has been pushing OAuth-first authentication across providers as a pattern, and xAI joining that list makes the `xai/*` provider stack more consistent with the rest of the platform.

## SuperGrok Subscription Required

This OAuth path is specifically for **SuperGrok subscribers**. If you are accessing xAI models via a standard API plan without a SuperGrok subscription, you will still need to use an `XAI_API_KEY`. The existing key-based path remains fully supported.

## Also in This Release

Beta.4 is a packed drop. Alongside the Grok OAuth login, the release also ships:

- Slack native assistant thread support ([#80787](https://github.com/openclaw/openclaw/issues/80787))
- fal and OpenRouter music generation providers
- CLI localization for Chinese (Simplified and Traditional)
- Group chat unmentioned inbound classification
- Dozens of targeted fixes across Telegram, Discord, Matrix, and core Gateway

Full release notes: [github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.4](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.4)
