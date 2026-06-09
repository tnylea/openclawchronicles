---
title: "OpenClaw Community Roundup: Clawcall, Zero-Cost Pipelines"
excerpt: "This week's community highlights: give your OpenClaw agent an inbound phone number with Clawcall, and build a zero-cost web automation pipeline with OpenRouter."
coverImage: '/assets/images/posts/openclaw-2026-6-9-community-roundup.png'
date: '2026-06-09T23:00:00.000Z'
dateFormatted: June 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-9-community-roundup.png'
---

Between today's 2026.6.5 stable release and Deno's Claw Patrol launch, it's been a busy Tuesday in the OpenClaw ecosystem. Here are two more community projects that landed this week.

## Clawcall: Inbound Phone Calls for Your Self-Hosted Agent

[Clawcall](https://github.com/CODEANDTRUST/clawcall) (Show HN) is a lightweight bridge that gives your self-hosted OpenClaw agent an inbound phone number. The idea is straightforward: instead of reaching your agent through Telegram, Discord, or WhatsApp, callers dial a number and the voice conversation routes into your OpenClaw instance.

The project lives at `github.com/CODEANDTRUST/clawcall` and targets self-hosters who want a phone-native interface for their agent — think calling your home assistant instead of messaging it. It's early (2 HN points at time of writing) but the concept fills a real gap: OpenClaw already has outbound voice via Twilio and Telnyx call integrations, and Clawcall closes the inbound loop.

This also pairs interestingly with the `talk.realtime.instructions` and voice steering features that shipped in recent 2026.5.x betas — a caller could steer the agent's behavior mid-call using those hooks.

## Zero-Cost Web Automation with OpenRouter and OpenClaw

A [Towards AI article](https://pub.towardsai.net/build-a-zero-cost-web-automation-pipeline-with-openrouter-openclaw-and-mediause-047dcdf61d1f) hit 5 points on HN this week: *"Build a ZeroCost Web Automation Pipeline with OpenRouter, OpenClaw, and MediaUse."*

The setup chains three free tiers together:

- **OpenRouter** — model routing with a free tier for low-volume requests
- **OpenClaw** — the agent runtime (self-hosted, so no hosting cost beyond your own hardware)
- **MediaUse** — media enrichment tooling

The post walks through connecting them to automate web research and content workflows. With today's 2026.6.5 stable also shipping Parallel as a bundled `web_search` provider, there are now even more free or low-cost search options to drop into this kind of pipeline.

For anyone looking to experiment with OpenClaw automation without committing budget, the zero-cost angle is a useful framing. The full tutorial is [on Towards AI](https://pub.towardsai.net/build-a-zero-cost-web-automation-pipeline-with-openrouter-openclaw-and-mediause-047dcdf61d1f).

## What Else Is Happening

A few other notes from the past 24 hours:

- **Claw Patrol** from Deno shipped today (covered separately) — the ecosystem's first TCP-level protocol-aware agent firewall, used in Deno's own production
- **2026.6.5 stable** is out — the biggest structural change is completing the SQLite state migration across six more runtime components, covered in detail in [today's release post](/posts/openclaw-2026-6-9-v2026-6-5-stable/)
- **HN discussions** continue to surface real-world OpenClaw use cases: one thread from earlier this week highlighted a developer using OpenClaw on Hetzner with Telegram for government procurement monitoring, job description matching, and invoice forwarding — all as daily cron tasks

The community build-in-public momentum around the 2026.6.5 stable release train has been consistent. Deno's Claw Patrol in particular signals that OpenClaw is now mature enough that major engineering teams are building internal infrastructure around it and open-sourcing the results.
