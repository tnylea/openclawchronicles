---
title: "OpenClaw Adds Provider Acceptance Diagnostics"
excerpt: "OpenClaw now records provider request acceptance across HTTP, SDK, and WebSocket transports for clearer model-call diagnostics."
coverImage: '/assets/images/posts/openclaw-2026-8-18-provider-acceptance-diagnostics.png'
date: '2026-08-18T23:03:00.000Z'
dateFormatted: August 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-18-provider-acceptance-diagnostics.png'
---

OpenClaw merged a broad provider-runtime fix in [PR #125807](https://github.com/openclaw/openclaw/pull/125807), adding a consistent way to report when a model provider has accepted a request.

Before the change, successful provider streams could complete without recording that the provider accepted the request. That left model diagnostics and plugin hooks unable to distinguish between a request that reached the provider and one that failed before acceptance.

Some forwarding wrappers also dropped the existing HTTP response callback. The result was uneven lifecycle visibility across otherwise supported provider paths.

## What Changed

Provider acceptance is now a shared lifecycle fact across HTTP, SDK, and WebSocket transports. Real HTTP paths report observed status and headers. Transports that cannot see complete HTTP metadata report that the provider stream opened rather than inventing status data.

The PR adds an additive `ProviderAcceptance` type, an `onProviderAccepted` callback, and lifecycle helpers under the supported `openclaw/plugin-sdk/provider-lifecycle` subpath.

It also centralizes HTTP acceptance, legacy `onResponse` delivery, abort handling, and unread-body cleanup in provider transport helpers. Built-in provider boundaries were updated for Anthropic, Amazon Bedrock, Google, Mistral, Ollama, and OpenAI HTTP and WebSocket paths. Anthropic Vertex and Bedrock Mantle now forward both lifecycle callbacks.

## Why It Matters

Provider diagnostics are most useful when they answer a basic question: did the request actually reach the provider?

Without that signal, failures can look similar even when they have very different causes. A local preflight failure, a wrapper bug, a provider rejection, and a stream that opened successfully but failed later all deserve different diagnostic language.

The merged change also avoids over-claiming. For example, the PR says Google Gen AI SDK 2.13.0 returns an opened async stream without exposing a complete status-and-headers pair for streamed responses. OpenClaw therefore records `provider_stream_opened` without fabricated HTTP data.

## User Impact

Operators should get more truthful provider-acceptance diagnostics across the built-in transport families. Plugin developers also gain an optional callback for observing successful non-HTTP streams, while existing HTTP response hooks keep their real status and headers.

The PR states there are no configuration, authentication, persistence, request payload, or database contract changes. The new Plugin SDK callback is optional and additive, while `onResponse` remains the compatibility contract for paths with real HTTP metadata.

## Evidence From The PR

The original reproduction showed Mistral completing with no response callback, Anthropic Vertex and Bedrock Mantle dropping the callback, and OpenAI HTTP calling it once before start. A live native Ollama run also completed with no response callback before the repair and with one acceptance plus one HTTP response callback after it.

Focused exact-branch tests covered 16 files and 691 passing tests across shared transports, Ollama, Amazon Bedrock, Anthropic Vertex, Google, Mistral, OpenAI completions, OpenAI Responses WebSocket, encrypted retry, ordinary retry, and model diagnostic lifecycle behavior.

The PR also reports `node scripts/check-changed.mjs`, production and test typechecks, Plugin SDK surface checks, `pnpm build`, docs checks, and an independent review with no findings. The primary risk is callback ordering at provider boundaries, and the tests cover success, rejection, retries, first-event ordering, callback failure, aborts, wrapper forwarding, WebSocket state, and unread-stream cleanup.
