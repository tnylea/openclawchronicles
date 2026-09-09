---
title: "OpenClaw Telegram Replies Recover After Proxy Refusals"
excerpt: "OpenClaw now treats refused Telegram proxy tunnels as unsent replies, allowing durable queue recovery instead of abandoning messages after outages."
coverImage: '/assets/images/posts/openclaw-2026-9-9-telegram-proxy-recovery.png'
date: '2026-09-09T23:00:00.000Z'
dateFormatted: September 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-9-telegram-proxy-recovery.png'
---

OpenClaw's Telegram channel has a reliability fix for one of the messier failure modes in proxied deployments: an HTTP proxy refusing the CONNECT tunnel before the request ever reaches Telegram.

The change landed in [PR #140388](https://github.com/openclaw/openclaw/pull/140388), titled `fix(telegram): replies are lost when the HTTP proxy refuses the tunnel`. The pull request says it fixes an issue where durable queued Telegram replies could be abandoned after a proxy refusal. Because the old path treated the result as ambiguous, recovery would refuse to replay the reply later.

That distinction matters. A message that might have reached Telegram should not be blindly sent again, because duplicate delivery can be worse than a visible failure. But when the request never got through the proxy tunnel, OpenClaw can safely keep the original intent pending and retry it.

## What Changed

The Telegram transport now classifies Undici's refused tunnel and proxy connection error shapes as requests that did not start. Once the error is known to be pre-send, the existing retry and durable recovery paths can handle the reply.

The PR keeps the narrower safety behavior where it belongs:

- Explicit and environment proxy dispatchers both get the classification.
- The original error cause is preserved.
- Caller cancellation still takes precedence.
- Ambiguous sends keep their no-replay protection.

That means OpenClaw is not loosening replay rules across the board. It is separating a known unsent proxy failure from cases where Telegram might already have received the request.

## Why Telegram Operators Should Care

Telegram deployments often sit behind corporate proxies, VPS egress layers, or network environments where a CONNECT tunnel may fail briefly. Before this fix, a transient proxy refusal could strand a durable reply. The system knew something went wrong, but it could not safely prove the send had not happened, so recovery stayed conservative.

With the new classification, an operator can restore the proxy and let OpenClaw deliver the original queued reply once. For users, the visible result is simple: a reply that would previously disappear after a proxy hiccup can arrive after connectivity returns.

The change is especially relevant for long-running agents that use Telegram as a primary control channel. Those agents may queue responses during restarts, network maintenance, or provider delays. Durable queues are only as useful as their failure classifications, and this PR tightens one of the important ones.

## Validation

The PR includes real Telegram Test Server evidence. According to the author, the original behavior reproduced the lost queued reply with both explicit and environment proxy settings. The candidate kept the intent pending, retried safely across Gateway restart, and delivered the original reply exactly once after the proxy was restored.

The test coverage also checked caller aborts, secure proxy hostname mismatch, accepted CONNECT followed by TLS reset, and direct sends. The final validation reports 124 focused tests across Telegram fetch, error handling, and proxy queue loopback coverage.

For OpenClaw operators, this is the kind of channel fix that matters most during bad network days: fewer silent losses, without turning recovery into duplicate spam.
