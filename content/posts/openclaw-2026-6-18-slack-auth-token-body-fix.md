---
title: "OpenClaw Fixes Slack Auth Token Body Leak"
excerpt: "OpenClaw PR #94574 stops sending Slack bot tokens in auth.test request bodies while preserving Authorization-header startup behavior."
coverImage: '/assets/images/posts/openclaw-2026-6-18-slack-auth-token-body-fix.png'
date: '2026-06-18T23:00:00.000Z'
dateFormatted: June 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-18-slack-auth-token-body-fix.png'
---

[OpenClaw PR #94574](https://github.com/openclaw/openclaw/pull/94574) landed today with a small but important Slack security correction: the Slack bot token is no longer passed in the request body when the provider calls `/api/auth.test`.

The token was already being supplied through the `Authorization` header, which is the right place for it. Sending the same credential in the body widened the number of places a sensitive token could appear in logs, proxies, traces, request capture tools, or debugging artifacts. The patch removes that redundant argument while keeping Slack Socket Mode startup intact.

## What Changed

The PR narrows Slack provider startup to one token path. Instead of calling Slack's `auth.test` with the bot token as a request argument, OpenClaw now relies on the Slack SDK's Authorization-header behavior.

That is a cleaner boundary for two reasons:

- The token stays in the standard bearer-token channel.
- Middleware and request-body logging have one fewer chance to capture it.
- OpenClaw's Slack provider still verifies the workspace and connects through Socket Mode.

The code change itself is small: two files, 32 additions, and one deletion. The significance is not the diff size, but the credential hygiene.

## Why Operators Should Care

Slack bots are often wired into high-trust workspaces. An OpenClaw Slack agent can receive team messages, run approved tools, coordinate with other systems, and hold long-lived app credentials. Any unnecessary duplication of those credentials becomes a risk multiplier.

This is especially true for self-hosted OpenClaw deployments where operators may run verbose HTTP logs during debugging. A token in an Authorization header can still leak if logging is careless, but a token in the body gives more tooling a chance to persist it accidentally.

The fix does not announce a known active exploit. It does, however, close a real exposure path in a channel integration that many production-style deployments care about.

## Proof Included

The PR includes both regression and live behavior proof. The targeted Vitest check verifies that the provider no longer passes the bot token in the call arguments. A live Slack API probe confirmed that Slack accepts `auth.test` with only the bearer header. A live OpenClaw provider proof then connected to Slack Socket Mode with real app credentials and exited cleanly after abort.

The maintainer proof also notes that a full desktop Mantis run hit an unrelated infrastructure issue before exercising the Slack path. That caveat is useful: the changed provider path was tested directly, while broader end-to-end coverage remains separate.

## The Takeaway

This is the kind of hardening that will rarely make a release headline but matters in the field. OpenClaw's Slack integration now avoids a redundant credential path during startup, which lowers accidental exposure risk without changing how operators configure their bots.

If you run OpenClaw in Slack-heavy environments, watch for this fix in the next build and keep treating Slack bot tokens like production secrets: short log retention, tight environment access, and no request-body capture unless absolutely necessary.
