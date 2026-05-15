---
title: "OpenAI Models in OpenClaw, Done Right: The Codex Harness Shift"
excerpt: "OpenClaw now routes OpenAI agent turns through the native Codex app-server by default, cutting prompt clutter and enabling dynamic tool search."
coverImage: '/assets/images/posts/openclaw-2026-5-15-codex-harness-openai.png'
date: '2026-05-15T23:00:00.000Z'
dateFormatted: May 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-15-codex-harness-openai.png'
---

OpenClaw already supported OpenAI models — but the old path had OpenClaw driving the entire model loop itself, translating between its own harness and the runtime OpenAI has been building specifically for agentic work. That translation layer added friction, duplicated tools, and created unnecessary guesswork.

With `v2026.5.14`, **the Codex app-server harness is now the default runtime for `openai/gpt-*` agent turns**. The [official blog post](https://openclaw.ai/blog/openai-models-in-openclaw-done-right) from Nik Pash explains the change in depth — here's what it means in practice.

## The New Division of Responsibility

The architecture now draws a cleaner boundary:

- **Codex owns the OpenAI turn**: native thread state, native tool continuation, compaction, code mode, and dynamic tool search.
- **OpenClaw owns the product around the turn**: channels, persona, memory, sessions, cron, media, browser, gateway, and OpenClaw tools.

This might sound like an internal implementation detail, but the practical effects are significant. The model no longer has to choose between duplicated workspace tools. It can use Codex-native `read`, `edit`, `patch`, `exec`, `process`, and planning tools directly, while OpenClaw keeps its own integration tools available without stuffing every schema into the first prompt.

## Dynamic Tool Loading: The Biggest Win

OpenClaw agents can have a lot of tools: messaging, sessions, media, cron, browser, nodes, gateway controls, web search, MCP servers, plugin tools, and channel-specific actions.

Under the old approach, every eligible tool schema landed in the initial context window — expensive and noisy. With the Codex harness, OpenClaw passes its product capabilities as **searchable dynamic tools**. The model discovers and loads a tool's schema only when it actually needs it, keeping the initial prompt smaller and reducing wrong-tool selection.

This pattern is already being ported back to non-OpenAI models. **PI Tool Search** is experimental in the default OpenClaw harness today: it gives non-Codex runs the same compact search/describe/call surface instead of preloading every eligible tool schema. It's not on by default for everyone yet — the bar is reliability across providers — but Codex proved the shape and every model should eventually benefit.

## Cleaner Visible Replies

In many agent systems, the final assistant string becomes the visible message almost by accident. Under the Codex harness, **OpenAI-backed OpenClaw turns prefer the `message` tool for visible source replies**. If the agent wants to say something, it explicitly calls the tool whose job is to send that message.

The practical result:

- Internal reasoning and tool work stay private.
- Visible replies are intentional, not a side-effect of text leaking out.
- Quiet turns are actually quiet — no spurious messages.
- Rich and media replies have a real, structured delivery path.

Heartbeats got the same treatment. Instead of relying on sentinel text like `HEARTBEAT_OK`, tool-capable heartbeat turns can use `heartbeat_respond` with a structured outcome — "nothing to report," "notify the user," or "schedule a follow-up."

## Your ChatGPT Subscription, Isolated Per Agent

OpenClaw routes OpenAI models through the Codex runtime by default — and auth can come from a subscription-backed profile, not just a raw API key:

```bash
openclaw models auth login --provider openai
```

Agent Codex state is isolated per agent: your OpenClaw agent gets its own Codex home, thread state, and account bridge. Personal Codex CLI setup does not silently bleed into OpenClaw agents, and agent state does not leak back into the CLI.

## Getting Started

The guided path:

```bash
openclaw onboard
```

Or directly:

```bash
openclaw models auth login --provider openai
openclaw config set agents.defaults.model.primary openai/gpt-5.5
```

The full details are in OpenClaw's [official announcement](https://openclaw.ai/blog/openai-models-in-openclaw-done-right).
