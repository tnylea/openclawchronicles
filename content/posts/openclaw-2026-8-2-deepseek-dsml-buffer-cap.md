---
title: "OpenClaw Caps DeepSeek DSML Recovery Buffers"
excerpt: "OpenClaw PR #117175 caps DeepSeek DSML recovery buffers at 256 KB so malformed provider streams cannot grow memory without bound."
coverImage: '/assets/images/posts/openclaw-2026-8-2-deepseek-dsml-buffer-cap.png'
date: '2026-08-02T08:01:00.000Z'
dateFormatted: August 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-2-deepseek-dsml-buffer-cap.png'
---

OpenClaw merged a P1 security-boundary fix this morning with [PR #117175, "fix(agents): cap DeepSeek DSML recovery buffer at 256 KB"](https://github.com/openclaw/openclaw/pull/117175). The change closes a memory-growth path in the recovery layer used for DeepSeek-compatible textual tool-call markup.

The issue was specific but important. DeepSeek-style providers can stream DSML markup for tool calls. If an outer DSML block never closed, OpenClaw previously kept accumulating recovery text while waiting for structure that might never arrive. A buggy provider stream, or a hostile one, could therefore keep memory tied up for the lifetime of the response.

The new behavior is deliberately firm: the DSML recovery owner enforces a 256 KB UTF-8 limit. That matches OpenClaw's existing safety envelope for native tool-call arguments and post-tool text.

## What Changed

The PR adds bounded scanning and byte accounting around the DSML recovery path. When an unterminated block crosses the limit, OpenClaw now fails with a visible transport error instead of silently guessing how recovery should continue.

The fix covers several edge cases:

- closing-token search resumes from the unscanned suffix instead of rescanning the full accumulated block
- blocks over the 256 KB limit fail immediately
- outer wrapper kinds must close exactly
- nested wrappers fail closed before any tool event is authorized
- malformed or nameless invokes cannot expose nested executable calls
- DSML-looking text inside a valid parameter value remains payload data
- split surrogate pairs retain exact UTF-8 byte accounting

Just as importantly, overflow cannot authorize a later textual tool call. That keeps the parser from treating malformed recovery text as permission to execute something after the stream has already crossed a safety boundary.

## Why It Matters

Textual tool-call recovery sits in a sensitive part of the agent runtime. It is trying to reconstruct structure from provider output, but the result can affect whether OpenClaw emits a tool event. That makes bounded memory and fail-closed parsing more than ordinary hardening.

For operators, the practical outcome is straightforward. Valid DeepSeek DSML calls at or below the cap continue to recover normally. Oversized textual DSML blocks now fail visibly, giving the operator and retry layer a concrete error rather than a hidden memory sink.

The compatibility tradeoff is also explicit. A valid textual DSML block larger than 256 KB will no longer recover. The maintainers accepted that because the limit matches the surrounding native tool-call safety policy.

## Evidence

The PR says the uncapped behavior was reproduced on current main before the fix landed. The regression suite includes a 256,001-byte block whose closing token arrives in the cap-crossing chunk, multibyte overflow, exact-cap split-surrogate accounting, nested wrappers, mismatched closes, malformed invokes, and DSML-like markers inside valid payloads.

The focused tests passed 65 of 65 across `openai-transport-stream.deepseek-and-shaping` and `deepseek-text-filter`. The PR also reports production HTTP/SSE transport error propagation, clean formatting checks, a clean exact-head review, and a passing required GitHub gate.

No OpenClaw config, protocol, or public API surface changed. This is a runtime boundary fix: malformed DeepSeek-compatible streams now have a bounded, visible failure path.
