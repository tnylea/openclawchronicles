---
title: "OpenClaw Redacts Discord REST Credentials"
excerpt: "OpenClaw now sanitizes Discord REST failure data so bot tokens, webhook secrets, and rate-limit diagnostics stay out of retained errors."
coverImage: '/assets/images/posts/openclaw-2026-7-31-discord-rest-credential-redaction.png'
date: '2026-07-31T23:03:00.000Z'
dateFormatted: July 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-31-discord-rest-credential-redaction.png'
---

OpenClaw merged a high-priority Discord security fix minutes before the July 31 nightly cutoff. [PR #116805](https://github.com/openclaw/openclaw/pull/116805), titled `fix(discord): prevent REST failures from exposing credentials`, moves credential cleanup into the shared Discord REST boundary.

The bug was not about successful message delivery. It was about what happens when Discord, a proxy, or another intermediary reflects sensitive values in an error response. Those failures can pass through normal sends, interaction webhooks, command deployment, voice-message requests, and scheduler diagnostics.

For a messaging-first agent runtime, that boundary matters. Failed sends are exactly when operators look at logs, metrics, retry keys, and structured diagnostics. If those objects retain bot tokens or webhook route secrets, a normal debugging path can become a secret-retention problem.

## What Changed

The fix makes `DiscordError` responsible for sanitizing bounded text and structured diagnostics before values are retained in messages, raw bodies, or raw error objects. That gives every consumer of Discord REST failures one cleaned representation instead of relying on each call site to remember its own redaction rules.

The PR also keeps operational behavior intact:

- Discord error codes and retry metadata still come from the original parsed response.
- Rate-limit bucket identifiers are stored as stable SHA-256 prefixes.
- Rate-limit scope is accepted only when it matches Discord's documented `user`, `global`, or `shared` values.
- Webhook-token route segments are hashed before scheduler identities or metrics keep them.
- The actual outgoing request URL is unchanged.

That last point is important. OpenClaw is not weakening requests or changing how Discord sees them. It is changing what OpenClaw retains after a failure.

## Why Operators Should Care

Discord bots often sit in busy team or community workspaces, and webhook routes can carry credentials directly in the path. If a scheduler key, metric label, or structured exception preserves that route as plain text, the data can travel further than intended: logs, traces, screenshots, test artifacts, or support bundles.

PR #116805 closes that class of leak at the shared client. It is labeled `P1`, `proof: sufficient`, `merge-risk: message-delivery`, and `merge-risk: security-boundary`, which matches the shape of the risk: keep delivery and retry behavior stable while preventing secrets from being captured during failures.

## Proof Behind The Patch

The PR body describes a production-path test using a real loopback HTTP server and OpenClaw's production `RequestClient`. The server reflected a synthetic credential through JSON values, nested objects, text, rate-limit headers, and a credential-bearing webhook route.

The assertions checked both halves of the fix: the secret disappeared from retained errors and scheduler metrics, while Discord codes, retry metadata, stable bucket grouping, and successful responses continued to behave normally.

The validation list is unusually broad for a channel-specific patch: 101 focused Discord tests, extension typechecks, linting, formatting, plugin-boundary checks, secret scans, and a green hosted CI run. For Discord operators, the headline is straightforward: failure diagnostics should remain useful, but credentials should no longer be part of the evidence trail.

