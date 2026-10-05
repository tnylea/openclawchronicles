---
title: "OpenClaw Fixes Provider Tool Call ID Collisions"
excerpt: "OpenClaw PR #165297 scopes provider tool call IDs by assistant turn, preventing collisions in GitHub publishing and client-hosted tool workflows safely."
coverImage: '/assets/images/posts/openclaw-2026-10-5-provider-tool-call-ids.png'
date: '2026-10-05T08:07:00.000Z'
dateFormatted: October 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-5-provider-tool-call-ids.png'
---

OpenClaw merged [PR #165297](https://github.com/openclaw/openclaw/pull/165297), a P1 agent-runtime fix for OpenAI-compatible providers that reuse tool call IDs across assistant responses.

The reported provider behavior is familiar to anyone who has worked with compatibility layers: a model may emit IDs such as `exec_0` or `github_publish_0` in more than one assistant message during the same run. Those IDs can be unique within a single response while still colliding across a longer interaction.

For OpenClaw, that was enough to break several workflows.

## What Broke

The PR identifies three user-visible collision paths:

- A later `github_publish` call could fail with a reused idempotency key or return an earlier publication result.
- A second tool-authored final reply in the same run could be dropped from the transcript.
- A later client-hosted tool call could overwrite or discard an earlier completed call.

There was also a latent collision risk for node plugin `node.invoke` idempotency keys. The PR notes that node hosts currently ignore that key, but the old value still had no turn scope.

## The Fix

OpenClaw now derives these keys from the issuing assistant turn identity plus the provider's call ID. It uses the provider `responseId` when available, otherwise the persisted `turnId` from `message_end`.

That detail matters. The key deliberately does not include the run ID because a persisted assistant message can be re-executed during recovery under a different run. For publication and source-reply transcript rows, replaying the same assistant message should keep the same dedupe key.

The change also adds an optional `assistantTurnId` to agent-core `tool_execution_end` lifecycle events, taken from the batch's assistant message. A shared helper now backs the turn identity derivation used by this fix and earlier Code Mode, `computer.act`, and `mobile.ui.act` handling.

The public SDK `captureToolAuthoredSourceReply` signature is unchanged.

## Why It Matters

Agent systems increasingly run through OpenAI-compatible providers, hosted adapters, local model routers, and compatibility servers. Those systems do not always share the same assumptions about how globally unique a tool call ID is.

OpenClaw's runtime has to treat provider IDs as scoped data, not universal identities. By binding raw call IDs to the assistant turn, the system preserves deterministic replay while avoiding false dedupe across later steps.

This is especially important for workflows that mix tool-authored replies, publication side effects, and client-hosted tools. One collision can look like a random dropped reply or an unrelated idempotency failure.

## Validation

The PR says nine new regression cases fail before the fix and pass afterward. Those cases reuse one tool call ID across two assistant messages with different arguments, then replay the first message.

Focused tests covered agent-loop behavior, node plugin tools, GitHub publish tools, embedded source replies, and attempt-wide client tools. The author also reports `pnpm tsgo`, formatting, core lint, and scoped-clean Codex autoreview after two findings about recovery-stable keys were addressed.

## Bottom Line

PR #165297 makes OpenClaw more tolerant of provider compatibility quirks. Tool call IDs are now scoped to the assistant turn where they were issued, which keeps publication, transcript, and client-tool state from colliding across a longer agent run.
