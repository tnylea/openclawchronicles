---
title: "Recursant Plugin for OpenClaw: Governance, Audit, and PII Redaction"
excerpt: "Recursant's new OpenClaw plugin adds in-process authorization, PII redaction, rate limiting, and audit logging to any OpenClaw deployment."
coverImage: '/assets/images/posts/openclaw-2026-5-15-recursant-plugin.webp'
date: '2026-05-15T23:00:00.000Z'
dateFormatted: May 15th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-15-recursant-plugin.webp'
---

A new governance plugin landed on ClawHub this week: **Recursant for OpenClaw** ([`openclaw-recursant`](https://clawhub.ai/plugins/openclaw-recursant)). It registers your OpenClaw instance with a Recursant registry and then governs tool calls, LLM calls, and chat messages via in-process interceptors — adding authorization, PII redaction, rate limiting, and full audit logging without modifying your agent's code.

## What Recursant Does

Recursant sits between your agent and everything it touches. The plugin hooks into five OpenClaw lifecycle events:

| Hook | What it governs |
|------|----------------|
| `before_tool_call` | Authorization + PII scrubbing + rate limiting; can block or rewrite params |
| `llm_input` | PII redaction on prompts; rate limiting; audit |
| `message_received` | Audit inbound chat |
| `message_sending` | PII redaction on outbound chat |
| `gateway_start` / `gateway_stop` | Enroll with registry, heartbeat, deregister |

This covers the two most sensitive data paths in any OpenClaw deployment: what goes into the LLM and what comes back out to users. PII redaction on both sides means that even if a user accidentally sends sensitive data, it's stripped before it reaches the model — and the model's output is cleaned again before delivery.

## How the Registry Works

On gateway start, Recursant exchanges an enrollment token for a JWT and begins a heartbeat loop with the registry. It then fetches your instance policy and starts pushing audit batches. On shutdown, it deregisters cleanly.

The API surface:

```
POST /v1/openclaw/instances/enroll    — Exchange enrollment token for JWT
POST /v1/openclaw/instances/heartbeat — Liveness + plugin version
GET  /v1/openclaw/instances/policy    — Fetch current policy
POST /v1/openclaw/instances/audit     — Push audit batches
POST /v1/openclaw/instances/deregister — Graceful shutdown
```

Policy is pulled from the registry at runtime, so you can update authorization rules or PII patterns without restarting the agent.

## Installing the Plugin

```bash
npm install -g openclaw-recursant
```

OpenClaw picks it up via plugin discovery. Then configure it with a `~/.recursant/openclaw.json` file (or via env vars, or OpenClaw's own plugin config):

```json
{
  "registryUrl": "https://recursant.example.com",
  "enrollmentToken": "<one-time token from registry UI>",
  "tenantId": "default"
}
```

Override the config path with `RECURSANT_OPENCLAW_CONFIG=/path/to.json`.

## The "v0" Caveat

The plugin is explicitly labeled **v0 — cooperative governance only**. That means it enforces policy in-process: if the plugin intercepts a tool call and decides to block it, the block happens. But it does not yet implement provider replacement or host-level enforcement — Recursant can't currently intercept calls that bypass the OpenClaw hook layer entirely.

The project's `openclaw-design.md` outlines a v1 roadmap that will address those gaps.

## Why This Matters

The OpenClaw ecosystem has been developing a cluster of security and governance tools: [BetterClaw](https://github.com/jfan22/BetterClaw) for workflow gates, [Permission Slip](https://permissionslip.dev) for approval layers, [Armorer](https://armorerlabs.com) for Docker isolation, and [PrivateClaw](https://privateclaw.dev) for TEE-backed execution. Recursant fills a different niche: **centralized policy management** with an audit trail. For enterprise deployments with compliance requirements, the combination of PII redaction and structured audit batches is exactly the kind of primitive that's been missing.

The HN post announcing the plugin landed with 2 points — modest traction, but the ClawHub listing is live and the install path is clean. Worth watching for v1.
