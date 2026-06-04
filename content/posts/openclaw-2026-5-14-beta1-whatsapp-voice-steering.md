---
title: "OpenClaw v2026.5.14-beta.1: WhatsApp Status Reactions, Voice Calls, and Steering by Default"
excerpt: "OpenClaw's newest beta brings WhatsApp into parity with Telegram and Discord for status reactions, adds Telnyx realtime voice call support, and makes mid-turn steering the default."
coverImage: '/assets/images/posts/openclaw-2026-5-14-beta1-whatsapp-voice-steering.webp'
date: '2026-05-14T23:05:00.000Z'
dateFormatted: May 14th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-14-beta1-whatsapp-voice-steering.webp'
---

OpenClaw v2026.5.14-beta.1 dropped late on May 14th, just hours after the v2026.5.12 stable release. It's a notably feature-rich beta — several of its changes address long-standing quality-of-life gaps, and at least two are significant enough that WhatsApp and voice-call users should take notice immediately.

## WhatsApp Finally Gets Status Reactions

WhatsApp users have been watching Telegram and Discord users enjoy the full status reaction lifecycle — thinking, tool use, done, error — while getting nothing on their end. That gap closes in this beta.

`StatusReactionController` is now wired into WhatsApp message turns ([#80612](https://github.com/openclaw/openclaw/pull/80612)), bringing the complete lifecycle to WhatsApp. The default emoji set has also been overhauled across all channels to be self-explanatory rather than emotional:

- 🧠 thinking
- 🛠️ tool use
- 💻 coding
- 🌐 web browsing
- ⏳ stall (soft)
- ⚠️ stall (hard)
- ✅ done
- ❌ error
- 🗜️ compacting

This is particularly useful for WhatsApp users who previously had no indication whether their agent was actively processing or silently hung. The fix also resolves [#59077](https://github.com/openclaw/openclaw/issues/59077), which had been open for quite a while.

## Telnyx Realtime Voice Calls

OpenClaw now supports realtime media-streaming conversational voice calls via Telnyx ([#81024](https://github.com/openclaw/openclaw/pull/81024)). This is distinct from the existing TTS playback capability — it's a live bidirectional voice session, similar to what OpenAI's Realtime API enables but routed through Telnyx's telephony infrastructure.

If you're building an agent that handles actual phone calls — intake, scheduling, support queues — this is the integration to watch. The voice call webhook path has also been hardened in this beta to reject malformed Host headers before provider signature checks, closing a class of potential abuse.

## Subagent Tasks Are Now Auditable

A meaningful change to how subagent delegation works. Previously, when a parent session spawned a subagent via `sessions_spawn`, the child's task was embedded in its system prompt — invisible to session history and impossible to audit after the fact.

This beta delivers the subagent task as the child session's first visible `[Subagent Task]` message ([#78592](https://github.com/openclaw/openclaw/issues/78592)). The full task description is now part of the session transcript, making delegation auditable without consuming extra tokens through system prompt duplication. For anyone running multi-agent workflows where accountability matters, this is a welcome change.

## Mid-Turn Steering Is Now Default

The behavior that lets you redirect an active agent run with a new prompt while it's still running (`/queue steer`) is now the **default** for mid-turn messages ([#77023](https://github.com/openclaw/openclaw/pull/77023)). Previously, sending a message during an active run queued it to run afterward.

Users who prefer the old queue-and-wait behavior can restore it with `/queue followup` or `/queue collect`. The `/steer` command itself now falls back gracefully to a normal prompt when steering isn't applicable — no more errors when the run already finished by the time your steering message arrived.

## DeepSeek V4 Flash Local Config Docs

The OpenClaw docs gain a dedicated page for **DeepSeek V4 Flash** running locally, covering on-demand startup configuration, context sizing, and live verification steps. If you've been experimenting with DeepSeek as a local model backend, the setup path is now significantly clearer with documented first-party guidance.

## isHeartbeat Flag on Agent Events

Gateway event payloads now carry an optional `isHeartbeat` flag ([#80610](https://github.com/openclaw/openclaw/pull/80610)) that lets clients distinguish scheduled heartbeat runs from ordinary user conversations. This is useful for dashboards, analytics pipelines, or monitoring tools built on top of the gateway event stream — you can now filter routine background activity from real interactions without pattern-matching on message content.

## Also in This Beta

- **Telegram Mini App button support** in `openclaw message send --presentation`, allowing Web App inline buttons in private chats ([#81356](https://github.com/openclaw/openclaw/pull/81356))
- **Agents `runRetries` config** at both `agents.defaults` and per-agent level for embedded Pi runner retry loop limits ([#80661](https://github.com/openclaw/openclaw/pull/80661))
- **Codex CLI session continuation** from an OpenClaw conversation — you can now bind and continue an existing Codex CLI session running on a paired node

## Getting the Beta

```bash
npm install -g openclaw@beta
# or pin to this specific build
npm install -g openclaw@2026.5.14-beta.1
```

Full changelog on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.14-beta.1).
