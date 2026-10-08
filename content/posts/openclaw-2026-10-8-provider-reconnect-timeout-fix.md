---
title: "OpenClaw Fixes Provider Reconnect Timeout Hangs"
excerpt: "OpenClaw PR #167013 restores fast TCP/TLS deadlines during provider reconnects, preventing stalled handshakes from hanging agent turns."
coverImage: '/assets/images/posts/openclaw-2026-10-8-provider-reconnect-timeout-fix.png'
date: '2026-10-08T08:07:00.000Z'
dateFormatted: October 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-8-provider-reconnect-timeout-fix.png'
---

OpenClaw merged [PR #167013](https://github.com/openclaw/openclaw/pull/167013), a P1 reliability fix for provider reconnects. The bug could make an agent turn wait for a long model idle timeout when a provider connection needed to reconnect and the TLS handshake stopped responding.

In plain English: a network hiccup could turn into a several-minute wait, even though the useful behavior was to hit the normal connection deadline, fail fast, and let the existing retry path recover.

## What Went Wrong

The PR explains that OpenClaw's inherited streaming timeout was being passed down as a connection timeout. That meant a long response/streaming budget could replace Undici's normal 10-second TCP/TLS connection deadline.

Those are different clocks. A model may legitimately need a longer request or stream budget once a connection is established. But a stalled TCP/TLS connection attempt should not inherit that whole model-idle window.

The reproduced failure was specific: a warmed provider dispatcher reused a path, the keep-alive socket was dropped, and the reconnecting TLS server withheld bytes. On main, the turn waited until the long idle timeout. With the fix, the stalled connection hit the fast connector deadline and the turn recovered through retry.

## The Fix

PR #167013 separates inherited stream timeouts from connection deadlines. OpenClaw now applies inherited defaults to response headers and bodies, while guarded fetch passes explicit request deadlines separately. Reusable dispatchers are keyed on both policies so the right timeout behavior survives pooling.

The change preserves explicit provider `timeoutSeconds` settings. If an operator has intentionally configured provider budgets, those documented connection and request budgets remain the source of truth.

The PR also keeps existing network protections intact: fresh DNS validation, address pinning, redirect policy, and unrelated active streams are not widened by this change.

## The Measured Impact

The PR's live Gateway proof is the reason this fix is worth calling out. In the baseline case, the transport failure surfaced as an LLM idle timeout after about 300 seconds, and the full agent turn completed after roughly 301 seconds.

With the fix, the stalled connection failed with `UND_ERR_CONNECT_TIMEOUT` at about 10.3 seconds, and the complete agent turn finished after roughly 11.7 seconds through the existing retry behavior.

That is a large user-visible difference. It changes the experience from "the agent is mysteriously stuck" to "the network path failed quickly and the system recovered."

## Why This Matters for OpenClaw Operators

OpenClaw users often run through custom providers, local gateways, proxies, and long-lived sessions. Connection reuse is good for performance, but it makes timeout ownership more important. A bad pooled reconnect should not borrow the timeout meant for an already-running model stream.

This fix makes the boundary clearer:

- Connection setup keeps a short TCP/TLS deadline
- Request and stream handling keep their own provider budgets
- Existing retry logic gets control quickly enough to help

That is especially useful for unattended runs and cron jobs, where a five-minute hang can cascade into missed schedules or confusing fallback behavior.

## Bottom Line

PR #167013 is not a new feature, but it is a meaningful reliability improvement. Provider reconnects should now fail at the connection layer when the connection is what stalled, rather than waiting for an agent-level idle timeout.

For anyone using OpenClaw with remote model providers, OpenAI-compatible endpoints, or custom provider routes, this is the kind of fix that makes failures feel bounded instead of spooky.
