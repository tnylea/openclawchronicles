---
title: "OpenClaw: Hermes Tops OpenRouter, Telegram Safety Debate"
excerpt: "Hermes Agent edges past OpenClaw on OpenRouter, HN debates secure messaging for AI agents, and two community tools launch this week."
coverImage: '/assets/images/posts/openclaw-2026-5-12-community-roundup.webp'
date: '2026-05-12T23:30:00.000Z'
dateFormatted: May 12th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-12-community-roundup.webp'
---

A busy stretch on Hacker News surfaced three threads worth tracking this week: a competitive benchmark showing OpenClaw losing its top spot on OpenRouter, a lively debate about the security risks of Telegram as an agent interface, and a pair of community-built tools extending OpenClaw in interesting directions.

## Hermes Agent Surpasses OpenClaw on OpenRouter

A [post this week](https://openrouter.ai/rankings) noted that Hermes Agent has surpassed OpenClaw as the top app on the OpenRouter leaderboard. The submission itself didn't spark much discussion (2 points, no comments), but the signal is worth watching.

OpenRouter tracks API usage across models and agent frameworks, and OpenClaw has held a dominant position there for most of 2026. Hermes, which has been gaining traction as a lighter-weight alternative with a more focused feature set, appears to have edged ahead — at least by OpenRouter's measurement.

This isn't necessarily alarming for OpenClaw. Usage rankings can shift quickly based on promotional campaigns, new integrations, or benchmark noise. But it's a reminder that the personal AI agent space is genuinely competitive, and OpenClaw's moat is the ecosystem — the 52,000+ ClawHub tools, the breadth of channels, and the operator customization depth — rather than raw usage numbers alone.

## Ask HN: We Need a Safe Alternative to Telegram for Agents

A [5-point Ask HN thread](https://news.ycombinator.com/item?id=48093824) made a case that Telegram — by far the most popular OpenClaw channel — creates a structural privacy problem. The argument: Telegram messages are unencrypted server-side, which means API tokens, OAuth URLs, and other sensitive data sent to your agent in conversation are accessible to Telegram's servers.

"How often did you post the Gmail authentication URL or another API token in the Telegram chat? Yes — you should feel at least a little uneasy now," the post reads.

The thread explores alternatives:

- **WhatsApp** works but is "not so tightly integrated"
- **Signal** runs into a different problem — Meredith Whittaker noted at a conference that giving web access to an agent exposes all private chats. A Signal fork dedicated to agentic use was floated as a hypothetical solution.
- **Compartmentalization** was the most practical suggestion: ensure an agent never accesses sensitive data without explicit approval, regardless of channel.

It's the same underlying tension that's spawned the [Permission Slip](https://permissionslip.dev) approval layer, [BetterClaw](https://github.com/jfan22/BetterClaw)'s workflow enforcement gates, and the per-sender tool policies that landed in [tonight's v2026.5.12-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.5.12-beta.2). The messaging channel as a security boundary is getting scrutiny it probably should have been getting all along.

There's no clean answer yet. But if you're deploying OpenClaw for anything beyond personal use, this thread is worth reading.

## Show HN: OpenClaw OS — OSS Claude Cowork on OpenClaw

[OpenClaw OS](https://github.com/thesysdev/openclaw-os) launched this afternoon as a Show HN from [@zahlekhan](https://github.com/zahlekhan). It's an open-source Claude Cowork clone built as an OpenClaw plugin.

The pitch: **live artifacts that connect to datasources** instead of static datasets. The demo shows Stripe data fetching automatically — so instead of a static artifact that shows a revenue chart, you get one that pulls live numbers. The project positions itself against task-management tools like Paperclip and Multica with a vision of "one screen that feels like the SaaS tools you already love."

Early-stage at launch (2 points, 0 comments), but the concept of OpenClaw-as-UI-substrate is interesting. As an OpenClaw plugin, it inherits channel routing, memory, and tool access without rebuilding any of that infrastructure. The plugin model lowering the barrier to building Cowork-style UIs on top of OpenClaw is a theme worth watching.

## Show HN: We Built OpenClaw but Worse (Supafax)

The most self-aware launch of the week: [Supafax](https://www.supafax.com/) titled its HN post "We Built OpenClaw but Worse." 4 points at the time of writing.

It's a familiar pattern — build something simpler and more focused than OpenClaw for a specific use case, and own the comparison. No comments yet, so it's hard to know what the differentiation is. But the honest framing at least makes it easy to find for anyone searching for OpenClaw-adjacent tools.

## What Connects These Stories

The common thread across all three is the same question the community has been wrestling with since the rough week in late April: **at what point does OpenClaw's power become a liability?** The Telegram thread is about trust boundaries in the messaging layer. Hermes' rise on OpenRouter suggests some users are choosing simplicity over capability. And both community tools are building constrained, focused surfaces on top of OpenClaw rather than using it raw.

The per-sender tool policies in tonight's beta are one answer. More will follow.
