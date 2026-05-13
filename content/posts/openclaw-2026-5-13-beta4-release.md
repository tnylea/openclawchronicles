---
title: "OpenClaw Beta.4: Per-Sender Tool Policies and Context Maps"
excerpt: "OpenClaw v2026.5.12-beta.4 introduces per-sender tool policies, a /context map command for session visualization, plus Slack, Telegram, and WhatsApp fixes."
coverImage: '/assets/images/posts/openclaw-2026-5-13-beta4-release.png'
date: '2026-05-13T08:00:00.000Z'
dateFormatted: May 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-13-beta4-release.png'
---

OpenClaw shipped `v2026.5.12-beta.4` early this morning — the fourth beta in this week's rapid release cadence and easily the most feature-dense. Alongside a wave of bug fixes, this release introduces two capabilities that operators running multi-user or public-facing bots will want to know about immediately.

## Per-Sender Tool Policies

The headline addition is **per-sender tool policies** ([#66933](https://github.com/openclaw/openclaw/pull/66933)), contributed by [@JerranC](https://github.com/JerranC). Until now, tool access in OpenClaw was controlled at the global, agent, or group level. With beta.4, operators can restrict specific tools down to the individual sender — keyed by a canonical channel-scoped sender identity.

This matters most for bots that are accessible to multiple people: you can now allow a trusted admin to use `exec` while locking it out for everyone else, all within the same agent configuration. The policy surface covers global, agent, group, core, bundled, and plugin tool layers.

This is a significant step forward for anyone running OpenClaw in a shared or semi-public context and one of the more requested security primitives in the project.

## /context map

New in this release: `/context map` ([#79867](https://github.com/openclaw/openclaw/pull/79867)) sends a **treemap image** showing the current session's context contributors — which tools, agents, memory files, and system prompts are eating your token budget. It's a quick diagnostic for sessions that feel slow or unexpectedly long-winded.

This joins `/context` as a first-class session inspection command.

## Subagent Session Nesting in the Control UI

The session picker in the Control UI now **nests subagent sessions under their parent** with a visual `└─` prefix ([#78623](https://github.com/openclaw/openclaw/pull/78623), by [@chinar-amrutkar](https://github.com/chinar-amrutkar)). It's a small change, but if you're orchestrating multi-agent workflows, it makes the session tree dramatically easier to navigate. Fixes a longstanding issue [#77628](https://github.com/openclaw/openclaw/issues/77628).

## Slack Gets Unfurl Controls and Better Mention Metadata

Three focused Slack improvements landed in beta.4:

- **Unfurl control** ([#80145](https://github.com/openclaw/openclaw/pull/80145)): New `unfurlLinks` and `unfurlMedia` config options let you suppress Slack's automatic link/media previews on bot replies — per-account if needed. Fixes [#48435](https://github.com/openclaw/openclaw/issues/48435).
- **Mention metadata** ([#75356](https://github.com/openclaw/openclaw/pull/75356)): Agents can now distinguish a direct bot mention from an implicit thread wake that mentions someone else. Previously, all thread activity looked the same.
- **DM routing fix** ([#80111](https://github.com/openclaw/openclaw/pull/80111)): `message.send` calls targeting Slack DM channel IDs (`D...`) now route correctly without splitting the thread into a separate channel session. Fixes [#80091](https://github.com/openclaw/openclaw/issues/80091).

## Telegram: Formatted Messages Preserved

[@obviyus](https://github.com/obviyus) fixed a regression ([#80977](https://github.com/openclaw/openclaw/pull/80977)) where supported HTML tags in Telegram replies were being escaped to plain text. Bold, italic, code, and other formatting now renders correctly in durable mirrors.

## WhatsApp and Stream Fixes

Two low-level fixes round out the stability story:

- **WhatsApp** ([#81246](https://github.com/openclaw/openclaw/pull/81246)): Pending debounced inbound messages now flush before the socket closes, preventing dropped messages during shutdown.
- **Azure Responses streams** ([#80927](https://github.com/openclaw/openclaw/pull/80927)): OpenAI-compatible SSE and JSON fallback streams now drain across split chunks. Azure Responses streams fail with a bounded first-event diagnostic instead of stalling indefinitely.

## Discord Voice: Channel Restrictions

A new `voice.allowedChannels` config option restricts which channels the bot can join or be moved into, with open behavior preserved when unset. Useful for bots deployed in servers with multiple voice channels you don't want the agent wandering into.

## Build: pnpm 11 and Fly Machines Support

The build toolchain has been upgraded to **pnpm 11** ([#79414](https://github.com/openclaw/openclaw/pull/79414), by [@altaywtf](https://github.com/altaywtf)), and the Gateway now detects **Fly Machines** as container environments from runtime env vars ([#80209](https://github.com/openclaw/openclaw/pull/80209), by [@liorb-mountapps](https://github.com/liorb-mountapps)), so `gateway bind` and Bonjour defaults align correctly for remote container deploys.

## Where to Get It

This is a pre-release. Install or update with:

```bash
npm install -g openclaw@latest
```

Or check the [full release notes on GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.12-beta.4) for the complete change log.
