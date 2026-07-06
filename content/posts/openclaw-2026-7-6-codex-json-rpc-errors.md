---
title: "OpenClaw Codex Errors Now Return JSON-RPC Codes"
excerpt: "OpenClaw now returns valid JSON-RPC error codes when Codex app-server request handlers fail during auth refresh."
coverImage: '/assets/images/posts/openclaw-2026-7-6-codex-json-rpc-errors.png'
date: '2026-07-06T08:02:00.000Z'
dateFormatted: July 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-6-codex-json-rpc-errors.png'
---

OpenClaw merged [PR #100713, "fix(codex): return JSON-RPC codes for handler errors"](https://github.com/openclaw/openclaw/pull/100713), a P1 Codex integration fix for a small protocol detail with a real user-facing cost.

The bug appeared when the Codex app-server asked OpenClaw to refresh ChatGPT auth tokens and the server-side handler failed. OpenClaw preserved the error message, but the serialized JSON-RPC error response did not include a numeric `error.code`.

That omission made the response malformed from Codex's point of view. Instead of seeing the underlying reauthentication failure, users could hit a generic timeout such as an auth refresh request timing out after 10 seconds.

## What Changed

The fix adds a standard JSON-RPC internal-error code, `-32603`, to server-request handler failure responses. It keeps the original handler error message in the payload and adds diagnostic logging for the failed server request method and id.

That means OpenClaw is not just saying "something went wrong." It is now returning a protocol-valid error object that downstream Codex clients can parse and handle as an actual failure from the auth bridge.

The PR also adds a regression test for a failing `account/chatgptAuthTokens/refresh` server-request handler, which is the path that made the issue visible.

## Why It Matters

Authentication failures need to be boring and precise. A timeout pushes users toward the wrong diagnosis: flaky networking, a stuck server, or a long-running background request. A valid JSON-RPC error lets the system surface the reauthentication issue closer to where it actually happened.

For OpenClaw users who run Codex through app-server flows, this improves the handoff between two layers that both need strict protocol behavior. The OpenClaw side can fail honestly, and the Codex side no longer has to reject the response as malformed before it can explain the real problem.

It is also the kind of fix that matters more as OpenClaw grows more app integrations. Server-initiated requests are only useful if failures can cross the boundary with enough structure for the other side to recover, retry, or ask the user to act.

## Validation

The PR reports targeted Codex app-server coverage:

- 29 tests passed for `extensions/codex/src/app-server/client.test.ts`.
- 110 tests passed across the client, shared-client, and auth-bridge suites.
- `git diff --check` passed.
- A local diff secret scan for token-like patterns passed.

The regression test verifies that handler exceptions serialize with `error.code: -32603` and preserve the original handler error message.

## Bottom Line

OpenClaw's Codex app-server bridge now sends valid JSON-RPC errors when handler failures occur. Users should see clearer auth-refresh failures instead of generic timeout noise, and Codex clients get the structured error payload they expect.
