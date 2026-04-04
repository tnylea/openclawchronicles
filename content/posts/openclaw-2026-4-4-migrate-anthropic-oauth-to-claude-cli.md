---
title: "How to Migrate OpenClaw from Anthropic OAuth to Claude CLI"
excerpt: "Anthropic blocked subscription OAuth for OpenClaw today. Here is the fastest path to restore your agents using the Claude CLI backend."
coverImage: '/assets/images/posts/openclaw-2026-4-4-migrate-anthropic-oauth-to-claude-cli.png'
date: '2026-04-04T23:00:00.000Z'
dateFormatted: April 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-4-migrate-anthropic-oauth-to-claude-cli.png'
---

Anthropic enforced a policy change at 12 PM PT today: Claude Pro and Max subscription tokens can no longer power third-party tools like OpenClaw. If your agents stopped working this afternoon, this guide will get you back online in under five minutes.

## What Happened

Anthropic formally revised its Terms of Service in February 2026 to restrict OAuth authentication to Claude Code and the official Claude.ai interface. Server-side enforcement went live today, April 4, 2026. Subscription OAuth tokens sent by OpenClaw now return authentication errors.

The good news: Anthropic is offering a one-time credit equal to your monthly subscription price, redeemable until April 17. If you prefer to walk away entirely, a full refund is available.

## Your Options

There are three viable paths forward:

1. **Claude CLI backend** — delegate to the locally installed `claude` binary. Your Max subscription still works here because it uses the official client.
2. **Anthropic API key** — switch to pay-as-you-go metered billing directly through the API.
3. **Alternative providers** — OpenAI, Gemini, DeepSeek, and others work out of the box with OpenClaw.

The CLI backend approach is the fastest option for existing Claude Max users who want to preserve their flat-rate subscription.

## Migrating to the Claude CLI Backend

### Step 1: Install the Claude CLI

If you do not have it already, install the official Claude CLI:

```bash
npm install -g @anthropic-ai/claude-code
```

Verify it works:

```bash
claude --version
```

### Step 2: Log in via Claude CLI

```bash
claude auth login
```

This opens your browser for standard OAuth sign-in through Anthropic's official client — the same flow Claude Code uses. Your Max subscription is valid here.

### Step 3: Switch OpenClaw to the CLI Backend

Run the following command from an interactive terminal (this cannot be run through an agent):

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

This tells OpenClaw to delegate all Anthropic requests to the local `claude` binary rather than making direct API calls with your subscription token.

### Step 4: Verify

Start or restart OpenClaw:

```bash
openclaw gateway restart
```

Send a test message to your agent. You should see responses flowing normally within seconds.

## If You Prefer the Direct API

If you would rather avoid the CLI dependency, a direct API key is equally straightforward:

1. Visit [console.anthropic.com](https://console.anthropic.com) and generate an API key.
2. Set it in OpenClaw: `openclaw config set providers.anthropic.apiKey YOUR_KEY`
3. Restart the gateway.

API pricing is pay-per-token. For typical personal use, costs are often comparable to or lower than the monthly subscription, especially after Anthropic's offered credits are applied.

## What About the One-Time Credit?

Anthropic confirmed it is issuing a credit equal to your current monthly plan to existing subscribers. This applies automatically to your account and offsets early API usage costs. Check your [Anthropic billing dashboard](https://console.anthropic.com/settings/billing) to confirm receipt. The credit expires April 17, so activate API usage soon if you plan to use it.

## Extra Usage Bundles

Anthropic is also offering pre-purchased "Extra Usage" bundles at up to 30% off for subscribers who want predictable monthly costs without the pay-as-you-go unpredictability. These appear in your account settings under **Plans & Usage**.

## The Bottom Line

The disruption is real, but the workaround is clean. The Claude CLI backend is the fastest route for existing Max subscribers, requiring a single command to redirect OpenClaw's traffic through the official client. For users comfortable with API pricing, a direct key is even simpler. Either way, your OpenClaw setup can be fully operational again today.

If you run into issues, the [OpenClaw docs on provider configuration](https://docs.openclaw.ai/providers/anthropic) have been updated to reflect the new authentication paths.
