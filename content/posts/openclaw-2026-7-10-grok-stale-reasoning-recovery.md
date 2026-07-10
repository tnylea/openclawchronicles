---
title: "OpenClaw Recovers xAI Grok Stale Reasoning Turns"
excerpt: "OpenClaw can now retry a narrow xAI Grok stale encrypted reasoning failure without replacing broader provider error behavior."
coverImage: '/assets/images/posts/openclaw-2026-7-10-grok-stale-reasoning-recovery.png'
date: '2026-07-10T08:03:00.000Z'
dateFormatted: July 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-10-grok-stale-reasoning-recovery.png'
---

OpenClaw merged [PR #97926, "fix(agents): xAI/Grok requests fail after a stale reasoning replay"](https://github.com/openclaw/openclaw/pull/97926), a P1 provider-reliability fix for xAI and Grok Responses turns.

The problem is specific but painful: xAI can reject stale encrypted reasoning replay with an HTTP 400 response whose message begins `Could not decrypt the provided encrypted_content`. OpenClaw already had a strip-and-retry path for known replay validation failures, but this exact xAI response shape was not classified as recoverable.

The result was simple: a turn that could have retried without stale encrypted reasoning content failed immediately.

## What Changed

The PR extends OpenClaw's replay-error classifier at the existing owner boundary. The new branch requires two things before it treats the response as recoverable:

- the provider response must be HTTP 400;
- the message must match xAI's exact case-insensitive stale decrypt phrase.

When those conditions hold, OpenClaw reuses the existing bounded retry path. It strips `encrypted_content` and retries once. Existing handling for `invalid_encrypted_content` and `thinking_signature_invalid` remains unchanged.

The narrowness is important. The matcher does not accept a generic decrypt message. The same phrase on HTTP 500 remains terminal. Requests without encrypted replay content do not get a retry path they cannot use.

## Why Stale Reasoning Replay Needs Care

Reasoning replay is a provider-specific area where a client may carry prior model state forward. When the provider can no longer decrypt or accept that state, the useful behavior is often to retry after removing the stale encrypted part.

But that kind of recovery should not become a blanket "try again differently" rule. Provider errors can represent policy failures, malformed requests, transport issues, or real service-side problems. OpenClaw's fix is deliberately scoped to the source-proven xAI 400 response and only when there is encrypted content to remove.

That keeps the recovery path helpful without hiding unrelated failures.

## User Impact

For users running xAI or Grok Responses through OpenClaw, some turns that previously died on stale encrypted reasoning replay can now recover transparently once.

The PR is also explicit about what does not change. Unrelated 400s, 500s, requests without encrypted replay content, and other transport failures keep their existing behavior. A retry is not treated as a permanent model or provider change; it is a one-turn recovery for a known stale replay failure.

## Evidence

The PR cites production evidence in issue #97925 with the exact codeless xAI HTTP 400 response. It also reports direct inspection of OpenAI SDK 6.39.1 to confirm the thrown error shape when the body is a string error without a code or type.

Test coverage uses that SDK factory shape and checks the matching 400, an unrelated decrypt 400, and the matching phrase on HTTP 500. Existing integration coverage proves a positive replay-error classification triggers exactly one retry with `encrypted_content` stripped.

The strongest proof is a controlled real-key xAI check: corrupting a genuine encrypted reasoning item returned the exact 400, while replaying the same request with only `encrypted_content` removed returned HTTP 200.

## Bottom Line

PR #97926 makes xAI/Grok reasoning replay more resilient without broadening OpenClaw's provider error semantics. It is a tight P1 recovery patch: recognize the proven stale encrypted-content response, strip the stale field once, and leave every other failure path alone.
