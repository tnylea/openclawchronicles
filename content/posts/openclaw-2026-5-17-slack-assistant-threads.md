---
title: "OpenClaw Now Supports Slack Assistant Thread Lifecycle"
excerpt: "OpenClaw gains full Slack assistant thread support with suggested prompts, thread-scoped sessions, and Slack-provided context in beta.4."
coverImage: '/assets/images/posts/openclaw-2026-5-17-slack-assistant-threads.webp'
date: '2026-05-17T08:00:00.000Z'
dateFormatted: May 17th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-17-slack-assistant-threads.webp'
---

One of the most requested Slack integration improvements landed in OpenClaw **v2026.5.16-beta.4**: native [Slack assistant thread lifecycle](https://api.slack.com/docs/app-manifests) support. This closes [#80787](https://github.com/openclaw/openclaw/issues/80787) and reshapes how OpenClaw bots behave inside Slack's assistant surface.

## What Slack Assistant Threads Are

Slack's assistant framework gives apps a dedicated thread context separate from regular channel conversations. When a user opens the App Home or triggers an assistant interaction, Slack spins up a thread scoped to that session — with its own message history, context, and lifecycle events. Apps that implement the assistant manifest entries get access to Slack-provided context (like the user's current channel, pinned items, or recent messages) and can surface suggested prompts before the user types anything.

Until now, OpenClaw's Slack integration handled messages but did not hook into these assistant-specific lifecycle events. That meant OpenClaw bots in Slack felt more like command-response bots than genuine assistants.

## What Is New in beta.4

The update adds:

- **Assistant view manifest entries** — OpenClaw now registers correctly as a Slack assistant app, enabling the assistant thread surface in App Home.
- **Suggested prompts** — You can configure prompts that appear to the user before they type, guiding common tasks or workflows.
- **Thread-scoped assistant sessions** — Each assistant thread maps to an isolated OpenClaw session, so conversation history stays clean and context does not bleed between users or interactions.
- **Slack-provided assistant context** — OpenClaw receives and can act on the context Slack injects into assistant threads (current channel, recent activity, etc.).

Thanks to [@mobybot27](https://github.com/mobybot27) for the implementation.

## How to Enable It

No new top-level config key is required — this is part of the Slack plugin. Make sure you are running beta.4 or later and that your Slack app manifest includes the `assistant_view` entry point. OpenClaw will handle the lifecycle events automatically once the bot is added to an assistant-capable workspace.

If you are using scoped app manifests (recommended for production), add the `assistant_views` scope and `app_home.home_tab_enabled: true` in your manifest JSON. Full manifest documentation is on the [Slack API docs](https://api.slack.com/docs/app-manifests).

## Why It Matters

This change moves OpenClaw from "Slack bot" to "Slack assistant." The difference is not cosmetic:

- **Contextual onboarding** — Suggested prompts mean users know what to ask without reading documentation.
- **Session isolation** — Thread-scoped sessions prevent cross-user context leaks in shared workspaces.
- **Platform coherence** — Slack's assistant UI is increasingly the entry point for AI tools in enterprise workspaces. Being a first-class assistant app matters for adoption.

## Also Fixed in This Release: Slack DM Thread Routing

Alongside the assistant thread work, beta.4 also fixes a long-standing Slack DM thread routing issue ([#82390](https://github.com/openclaw/openclaw/issues/82390)): replies within a direct-message thread now stay on the main DM session instead of routing to invisible thread-scoped sessions that users could not access. If you have seen "ghost" replies in Slack DMs, this should resolve it.

Full release notes: [github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.4](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.4)
