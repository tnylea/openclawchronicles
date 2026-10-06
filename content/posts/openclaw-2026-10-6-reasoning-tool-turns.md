---
title: "OpenClaw Fixes Reasoning Model Tool Turns"
excerpt: "OpenClaw now routes official OpenAI reasoning-model tool turns through Responses when Chat Completions cannot carry them."
coverImage: '/assets/images/posts/openclaw-2026-10-6-reasoning-tool-turns.png'
date: '2026-10-06T23:15:00.000Z'
dateFormatted: October 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-6-reasoning-tool-turns.png'
---

OpenClaw merged a P1 model-routing fix today for a painful mismatch between reasoning models, tools, and the official OpenAI Chat Completions endpoint.

The fix landed in [PR #166182](https://github.com/openclaw/openclaw/pull/166182), "fix: tool turns fail for reasoning models on api.openai.com Completions routes." It addresses agent turns where a reasoning model such as `gpt-6-astra` or `gpt-6.1-sol` runs through an `openai-completions` provider on `api.openai.com`.

## The Failure Mode

The core problem was endpoint capability. Current GPT reasoning models on OpenAI Chat Completions reject function tools when reasoning is enabled and direct callers toward `/v1/responses`.

Some models made the failure unavoidable. The PR says Astra and GPT-6.1 Sol also reject `reasoning_effort: "none"`, so there was no Chat Completions payload that could serve their tool-bearing turns. GPT-5.6 tool turns ran with reasoning switched off, while GPT-6 Sol and GPT-5.4 first hit a 400 and then retried with thinking off.

For users, that meant tool turns either failed outright or silently lost the reasoning behavior they had selected.

## What OpenClaw Does Now

When the managed Completions transport targets the official OpenAI endpoint with a reasoning model and tools, OpenClaw sends the turn through its existing managed Responses transport.

The route remains authored as `openai-completions`. The provider, credentials, endpoint host, auth, and runtime-selection behavior stay the same. The change is the internal transport path OpenClaw chooses when the official endpoint cannot represent the requested turn shape.

The PR also notes two compatibility details:

- Forced tool choices are converted into the Responses format.
- An unset reasoning selector keeps the Completions default of `high`.

Custom or proxy `openai-completions` endpoints, Azure, and direct `@openclaw/ai` Chat Completions SDK usage are unchanged.

## Why This Is The Right Boundary

The important distinction is between a user's configured route and the wire protocol needed to make that route work against the official provider.

Users chose a reasoning model with tools. OpenClaw already has a Responses transport that can carry that shape. Rather than forcing users to learn which OpenAI endpoint can represent which feature combination, the managed route now bridges the mismatch where it can do so without changing the visible provider contract.

That is a better default for agent work. Tool calls are not an edge feature in OpenClaw; they are central to most useful turns. A selected reasoning level should survive the first tool call whenever the provider offers a compatible API path.

## Evidence From the PR

The PR includes regression coverage for the official OpenAI Completions route with reasoning models and tools, including Astra and GPT-6.1 Sol. It also covers forced tool choices, preserved reasoning level, and the boundary that non-official endpoints are not rerouted.

The author reports that tool-bearing turns on these routes now succeed and keep the selected reasoning level. That is the user-visible win: no HTTP 400 wall for Astra or GPT-6.1 Sol tool turns, and no quiet fallback that strips reasoning from models where the user expected it.

## Bottom Line

OpenClaw is smoothing over a provider API split without surprising custom endpoints. Official OpenAI reasoning-model tool turns now use the transport that can actually carry them, while the configured `openai-completions` route keeps behaving like the route users authored.
