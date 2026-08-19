---
title: "OpenClaw Blocks Malformed Streamed Tool Calls"
excerpt: "OpenClaw now rejects malformed streamed provider tool calls before execution and preserves richer Ollama error context for operators."
coverImage: '/assets/images/posts/openclaw-2026-8-19-malformed-tool-call-guard.png'
date: '2026-08-19T23:00:00.000Z'
dateFormatted: August 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-19-malformed-tool-call-guard.png'
---

OpenClaw merged a provider safety fix in [PR #126391](https://github.com/openclaw/openclaw/pull/126391), tightening how streamed tool calls become executable when model output arrives in pieces.

The risk was direct: a provider stream could expose partial JSON for live previews, but if the terminal argument object was truncated, malformed, or never closed, OpenClaw could still treat an incomplete sibling tool call as ready to run. The PR reports pre-fix reproductions where an Anthropic stream emitted a tool call from truncated JSON and where Ollama emitted an empty argument object from malformed string arguments.

That is exactly the boundary agent operators care about. A preview can be partial. An executable tool call cannot.

## What Changed

OpenClaw now routes Anthropic, Anthropic transport, Amazon Bedrock, Mistral, OpenAI Completions, OpenAI Responses, and Ollama through a shared terminal validation contract. Partial JSON can still be useful while the stream is ongoing, but the terminal batch must validate as complete before any sibling call becomes executable.

The PR also makes two Ollama-specific repairs. Ollama streams now fail closed on malformed or trailing NDJSON, and provider errors are projected through the shared coded-error owner instead of being flattened into plain text. Tool-result replay keeps bounded structured text, supported image payloads, explicit error semantics, and tool-call identity.

For users, the result is intentionally boring in the best way:

- malformed terminal arguments become visible provider errors;
- incomplete streamed calls do not silently execute;
- Ollama-backed agents keep enough result and failure context for the next model turn;
- no public protocol, storage, configuration, migration, or manifest change is required.

## Why It Matters

Streaming makes agents feel fast, but it also creates a tricky security and correctness boundary. The system has to separate "what the model appears to be saying right now" from "what the agent is allowed to execute."

This fix moves that distinction into one shared owner instead of letting each provider interpret terminal stream state slightly differently. That matters because OpenClaw supports a broad provider matrix, and a malformed tool call should not be safer on one provider than another.

The Ollama changes are also important for self-hosted and local-model operators. When a local stream fails, the next turn needs structured evidence of what happened, not a flattened string that loses the error code, media, structure, or call correlation.

## Evidence From The PR

The PR includes focused regressions across the affected providers: 245 shared plus Anthropic/provider-transport tests, 124 OpenAI Responses/Completions plus Mistral tests, and 237 Bedrock plus Ollama tests passed.

Repository validation included `node scripts/check-changed.mjs` and `pnpm build`. The changed gate covered production and test typechecks, oxlint, Plugin SDK surface and export checks, plugin boundaries, import cycles, dead exports, format, and ratchets.

Live proof included a direct Anthropic Messages forced-tool turn returning the complete expected argument and a real Ollama Cloud native-chat lane passing against the authorized model catalog. The malformed-byte paths are covered by exact provider wire fixtures, since live services cannot be asked to intentionally corrupt their own stream output.
