---
title: "OpenClaw beta.2: Telnyx Voice Calls, WhatsApp Reactions, and Mid-Turn Steering"
excerpt: "OpenClaw v2026.5.14-beta.2 lands realtime Telnyx voice calls, expressive WhatsApp status reactions, transparent subagent tasks, and mid-turn steering."
coverImage: '/assets/images/posts/openclaw-2026-5-15-beta2-voice-reactions.png'
date: '2026-05-15T23:00:00.000Z'
dateFormatted: May 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-15-beta2-voice-reactions.png'
---

OpenClaw shipped `v2026.5.14-beta.2` on May 15th — the second beta in this cycle — and it's a big one. The changelog covers realtime voice calls, a completely revamped WhatsApp status-reaction system, mid-turn steering for active runs, and meaningful transparency improvements for subagent tasks. Here's what landed.

## Telnyx Realtime Voice Calls

The headline feature: OpenClaw agents can now participate in **realtime media-streaming voice calls via Telnyx**. The implementation ([#81024](https://github.com/openclaw/openclaw/pull/81024), thanks to `@dynamite-bud`) adds a conversational voice-call mode to the Telnyx channel, distinct from the existing one-off TTS replies. This means your agent can hold a back-and-forth spoken conversation routed through Telnyx infrastructure — a significant step toward phone-native agent workflows.

## WhatsApp Gets Expressive Status Reactions

WhatsApp was the last major channel without lifecycle status reactions. That changes in beta.2: the `StatusReactionController` is now wired into WhatsApp message turns, giving it the same queued → thinking → tool → done/error lifecycle already present on Telegram and Discord ([#80612](https://github.com/openclaw/openclaw/pull/80612), thanks to `@gado-ships-it`).

The default emoji set was also replaced across all channels with self-explanatory indicators:

- 🧠 thinking
- 🛠️ tool use
- 💻 coding
- 🌐 web request
- ⏳ stall (soft)
- ⚠️ stall (hard)
- ✅ done
- ❌ error
- 🗜️ compacting

These read as system status rather than emotional commentary — a sensible upgrade if you run a channel-facing agent and want users to understand what's happening without guessing.

## Mid-Turn Steering

A long-requested improvement: mid-turn prompts now steer active runs by default via `/queue steer` ([#77023](https://github.com/openclaw/openclaw/pull/77023), thanks to `@fuller-stack-dev`).

Previously if you sent a message while the agent was mid-run, it would queue. Now it steers — meaning the agent can absorb new direction without finishing its current trajectory. The older `/queue followup` and `/queue collect` behaviors remain available for users who prefer those semantics. And `/steer` gracefully falls back to a normal prompt when steering isn't available.

## Subagent Tasks Are Now Visible

Subagent delegation got a transparency upgrade. `sessions_spawn` tasks are now delivered in the **child session's first visible message** (`[Subagent Task]`) instead of being hidden in the sub-agent system prompt ([fixes #78592](https://github.com/openclaw/openclaw/issues/78592), thanks to `@bradestes` and `@stainlu`).

The result: delegated work stays auditable without duplicating tokens in the system prompt. You can see what was handed off directly in the conversation thread.

## Continue Codex Sessions from OpenClaw Chat

OpenClaw agents can now **list and bind existing Codex CLI sessions** running on a paired node, letting an OpenClaw conversation continue where a local Codex session left off. Combined with the Codex harness becoming the default for OpenAI model turns (covered in the [official blog post](https://openclaw.ai/blog/openai-models-in-openclaw-done-right)), this tightens the Codex/OpenClaw integration considerably.

## Canvas Lazy-Loading

Gateway startup time gets a modest improvement: Canvas implementation costs are now deferred until first use, rather than loading at startup ([#82001](https://github.com/openclaw/openclaw/pull/82001), thanks to `@samzong`). If you don't use Canvas features, your gateway cold-start skips that overhead entirely.

## Notable Fixes

- **Structured-output restored**: `response_format` from OpenAI-compatible `/v1/chat/completions` requests now properly flows through agent stream params ([#82004](https://github.com/openclaw/openclaw/pull/82004)).
- **Discord streaming**: Stale truncated draft previews are now cleaned up when finalization fails ([fixes #82035](https://github.com/openclaw/openclaw/issues/82035)).
- **Config numeric keys**: Discord guild IDs and other numeric-looking object keys survive config patch merges ([#81999](https://github.com/openclaw/openclaw/pull/81999)).
- **Telegram bot init race**: Isolated polling no longer retries every update with "Bot not initialized" on startup ([#81975](https://github.com/openclaw/openclaw/pull/81975)).
- **macOS screen snapshots**: Malformed params are now rejected before capture, and base64 results are bounded against projected frame limits ([fixes #68181](https://github.com/openclaw/openclaw/issues/68181)).
- **Cron timeout fix**: Isolated agent jobs that have dispatched to a backend are now governed by their configured job timeout instead of the 60s pre-execution watchdog ([#81871](https://github.com/openclaw/openclaw/pull/81871)).

## Upgrade

```bash
npm update -g openclaw
```

Or check the [full release notes on GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.14-beta.2) for the complete changelog across 80+ contributors.
