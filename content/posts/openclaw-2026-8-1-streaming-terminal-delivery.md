---
title: "OpenClaw Preserves Streaming Terminal Events"
excerpt: "OpenClaw PR #117505 keeps final SSE events and DONE frames intact during Gateway shutdown for OpenAI-compatible clients."
coverImage: '/assets/images/posts/openclaw-2026-8-1-streaming-terminal-delivery.png'
date: '2026-08-01T23:03:00.000Z'
dateFormatted: August 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-1-streaming-terminal-delivery.png'
---

OpenClaw merged another P1 Gateway availability fix tonight: [PR #117505, "fix(gateway): preserve Chat and Responses streaming terminal delivery"](https://github.com/openclaw/openclaw/pull/117505). It protects the final moments of OpenAI-compatible streaming responses when the Gateway begins shutting down.

The affected paths are the familiar `/v1/chat/completions` and `/v1/responses` streaming endpoints. In both cases, a request can produce useful streamed output and still fail at the very end if the terminal success or error event never reaches the client.

That final event is not decoration. It is how SDKs and client code know the stream is complete, how failures are surfaced, and how callers distinguish a clean ending from a broken connection.

## What Changed

Before this fix, Gateway shutdown could decide a streaming request was drained before its deferred terminal frame had actually been delivered. The endpoints released their only continued root when agent execution settled, even though HTTP response delivery was still waiting on a microtask or the next event-loop turn.

PR #117505 separates those lifetimes. Each streaming endpoint now retains one reference for detached agent execution and a separate reference for HTTP response delivery. Both are acquired before the disconnect watcher can synchronously observe an already-closed client.

The response reference is released only when the response actually finishes, closes, or disconnects. The agent reference survives until the real cleanup `finally` completes. That lets OpenClaw preserve subordinate admission after abort while still allowing disconnected requests to abort promptly.

The patch does not add a second request path or alter the public protocol. It keeps existing usage accounting behavior intact, including aggregate and last-call token selection, cached input and cache-write details, and reasoning-token accounting.

## Why It Matters

OpenAI-compatible APIs are a major integration surface for OpenClaw. A lot of client libraries treat streaming responses as structured protocols, not raw text trickles. If the final SSE frame or `[DONE]` marker disappears during shutdown, callers can hang, retry unnecessarily, or record incomplete outcomes.

This is especially important for local and self-hosted deployments where users may restart the Gateway during active work. Shutdown should be graceful in the parts of the system that already accepted a request. If an assistant completed the work and a terminal event is queued, the Gateway should hold the response lifetime long enough to deliver it.

The fix also preserves failure semantics. Clients should receive one complete success or failure terminal event, not a partial stream that leaves them guessing.

## Evidence

The PR reports a tests-first reproduction against real Gateway servers and the official OpenAI SDK. The reproduction failed across both supported endpoints and both Gateway projects: eight genuine failures observed zero admitted roots instead of one.

The final exact-head run passed 48 selected tests across four Gateway-project test files. Coverage includes SDK endpoint success and error terminals, wire-level `[DONE]`, root-drain state, abort-ignoring cleanup, token-usage fallback and details, assistant microtask flushing, mapped provider errors, tool-choice handling, and existing admission behavior.

For operators, the impact is boring in the best way: OpenClaw streams should end cleanly, even when shutdown begins at the same time.
