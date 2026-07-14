---
title: "OpenClaw Sanitizes LINE Tool Traces"
excerpt: "OpenClaw now strips internal assistant tool-trace banners from LINE replies while preserving normal prose, rich content, and chunked delivery."
coverImage: '/assets/images/posts/openclaw-2026-7-14-line-tool-trace-sanitizer.png'
date: '2026-07-14T23:01:00.000Z'
dateFormatted: July 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-14-line-tool-trace-sanitizer.png'
---

OpenClaw merged a P1 LINE delivery fix Tuesday night that prevents internal assistant tool-trace banners from leaking into user-visible replies. The patch landed in [OpenClaw PR #101708](https://github.com/openclaw/openclaw/pull/101708) and is labeled as a message-delivery risk area, which fits the bug: the wrong text could reach the wrong surface.

The issue was subtle because LINE has more than one outbound path. The generic outbound adapter could be hooked, but the normal inbound auto-reply path also needed the same boundary before Markdown conversion.

## What Changed

The fix applies the shared `sanitizeAssistantVisibleText` boundary in both LINE delivery paths:

- Standard outbound adapter delivery.
- Inbound auto-reply delivery before Markdown conversion.

That shared boundary suppresses internal-only text without consuming a LINE reply token. Normal prose, fenced examples, and rich content continue to pass through.

The delivery result also now carries whether visible output was actually sent. That lets dispatch distinguish a suppressed internal-only response from a real reply. The chunk fallback path was tightened too: if a reply-token batch succeeds and a later push chunk fails, OpenClaw no longer replays the already-delivered reply batch.

## Why It Matters

Tool traces are useful to operators and runtime developers, but they are not end-user content. A channel adapter has to be especially strict when the assistant output may include internal banners, tool status text, or orchestration metadata.

LINE adds an extra constraint because reply tokens are time-sensitive and can be consumed by delivery attempts. A sanitizer that suppresses internal-only text should not burn a token, and a chunked fallback should not duplicate content after partial success.

This PR closes both sides of that boundary: privacy of the visible message and correctness of the delivery accounting.

## User Impact

LINE users should no longer see internal tool-trace banners in bot replies. Ordinary messages still render, Markdown examples remain intact, and rich content still flows through the same delivery paths.

If LINE accepts an initial reply batch and a later push chunk fails, the accepted reply batch is not resent. That reduces the risk of duplicate visible messages during partial delivery failures.

For OpenClaw operators, the change makes LINE behavior line up with the broader assistant-visible-text contract: internal-only output is suppressed, while actual user-facing answers remain deliverable.

## Verification

The PR reports a focused LINE delivery suite with 37 tests passing and a full LINE suite with 325 tests passing. It also ran `pnpm check:changed`, targeted formatting, and an exact-head hosted merge-ref CI run.

The most useful proof is a loopback HTTP exercise through the production LINE auto-reply orchestration. It verified that a sanitized visible reply reached the wire, an already-successful reply batch was not replayed after a later HTTP 503 push failure, and internal-only output produced zero HTTP requests.

The known gap is that the final maintainer head was not credentialed against the external LINE service, but the loopback proof covered the production delivery orchestration and real HTTP failure semantics.
