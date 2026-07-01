---
title: "OpenClaw Adds GPT-5.6 Preview Support"
excerpt: "OpenClaw now recognizes GPT-5.6 Sol, Terra, and Luna preview models across OpenAI, Codex OAuth, and App Server workflows."
coverImage: '/assets/images/posts/openclaw-2026-7-1-gpt-5-6-preview-support.png'
date: '2026-07-01T08:05:00.000Z'
dateFormatted: July 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-1-gpt-5-6-preview-support.png'
---

OpenClaw merged [PR #98333, "feat(openai): add GPT-5.6 series support"](https://github.com/openclaw/openclaw/pull/98333) on July 1st, giving operators with preview access a first-class path to the GPT-5.6 Sol, Terra, and Luna model IDs.

The change matters because model support in OpenClaw is not just a name in a dropdown. The same model contract has to survive API-key routes, ChatGPT/Codex OAuth, simple-completion paths, Codex App Server discovery, reasoning-effort normalization, context metadata, pricing metadata, and fallback behavior.

Before this patch, OpenClaw did not reliably recognize the limited-preview GPT-5.6 series across those surfaces. That meant users with access could run into stale metadata, wrong transport selection, or reasoning effort clamps that did not match the model.

## What Changed

The PR adds model contracts for:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

The new contracts include current preview pricing, 372k context metadata, text and image input support, and model-aware reasoning normalization. The PR body says `max` reasoning is preserved for the GPT-5.6 series, while unsupported `minimal` requests normalize to `low`.

OpenClaw keeps `openai/gpt-5.5` as the default, so this is not a surprise model migration for existing deployments. It is a capability unlock for teams that already have preview access and want to use those models through OpenClaw's normal provider and app-server routes.

## Codex App Server Discovery Gets Refreshed

The change also upgrades the Codex App Server package to `0.142.4`, refreshes generated protocol schemas, and updates the documented model snapshot.

That part is easy to overlook, but it is important. OpenClaw can see model metadata from multiple places: static fallback rows, direct provider definitions, OAuth-backed discovery, and App Server discovery. The PR says live App Server reasoning metadata is now treated as authoritative without mistaking synthetic fallback rows for live capability data.

For operators, that should mean fewer strange mismatches where a model appears selectable but behaves like an older or differently routed model once the request leaves the UI.

## Why Reasoning Effort Matters

The preview series introduces a practical routing issue: not every model family supports the same reasoning effort names in the same way. A blanket clamp can make a high-effort model underperform, while a permissive route can ask an older model for a mode it does not support.

This PR makes the GPT-5.6 path model-aware. In the reported live end-to-end proof, `openclaw agent --local --model openai/gpt-5.6-luna --thinking max` returned through provider `openai`, model `gpt-5.6-luna`, harness `codex`, with 372000 context tokens, `thinking=max`, no fallback, and a successful stop.

That is the right kind of proof for this change: it shows the user-facing model selection, provider route, context budget, and reasoning effort agreeing in one real run.

## Validation

The PR cites OpenAI's GPT-5.6 preview announcement, preview access and pricing details, and model-selection guidance as the source contract. It also reports exact `@openai/codex` `0.142.4` `model/list` discovery confirming Sol, Terra, and Luna rows and supported efforts.

On the test side, the branch reports 303 focused changed-surface tests passing across OpenAI, agent, Codex, and App Server shards, plus `pnpm tsgo:all`, `pnpm build`, focused linting, `git diff --check`, and a clean local autoreview.

## Bottom Line

OpenClaw's GPT-5.6 support is a preview-access story, not a default-model story. Existing users remain on GPT-5.5 unless they choose otherwise.

But for teams already testing GPT-5.6 Sol, Terra, or Luna, this patch makes OpenClaw a much cleaner control plane: the model IDs are recognized, the long context metadata is present, `max` reasoning survives the route, and Codex App Server discovery is aligned with the same contract.
