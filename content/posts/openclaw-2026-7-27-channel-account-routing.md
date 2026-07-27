---
title: "OpenClaw Rejects Invalid Channel Account Routes"
excerpt: "OpenClaw now rejects invalid channel account selections instead of silently borrowing another configured account for message delivery."
coverImage: '/assets/images/posts/openclaw-2026-7-27-channel-account-routing.png'
date: '2026-07-27T23:05:00.000Z'
dateFormatted: July 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-27-channel-account-routing.png'
---

OpenClaw closed a sharp multi-account routing bug tonight with [PR #113417, "fix: reject invalid channel account selections"](https://github.com/openclaw/openclaw/pull/113417). The fix changes how explicit account choices are handled when a channel action is sent through Gateway, the CLI, commands, agents, or Feishu.

The problem was simple to describe and risky in practice: when a caller selected an invalid or disabled channel account, OpenClaw could fall back to another configured account instead of rejecting the request. In a single-account setup, that might look like a confusing success. In a multi-account workspace, it could mean a message, media operation, poll, or provider action uses the wrong identity.

## What Changed

The new behavior is strict for explicit account selections. If a caller supplies an account ID that is invalid, disabled, nonexistent, conflicting, or mismatched with the selected channel, OpenClaw fails the route instead of borrowing another account.

The PR keeps existing behavior for omitted account choices and trusted defaults. That distinction matters: an operator who lets OpenClaw choose the default account still gets the configured default path, while an operator or model that names a specific account must land on a valid enabled account for that channel.

The routing fix also tightens idempotency around the canonical channel and account route. Gateway `send`, `poll`, and `message.action` mutations now scope idempotency to the validated route. Omitted and explicit default routes share the same mutation scope, and the first validated route stays replayable across default, plugin, and account configuration changes.

## Why It Matters

Channel account routing is a security and trust boundary, not just a convenience feature. OpenClaw deployments often connect multiple Slack workspaces, Telegram bots, Feishu apps, or other channel accounts. A fallback from "that account is invalid" to "use a different account that happens to work" can hide mistakes and create confusing audit trails.

This patch makes the failure mode clearer:

- Valid explicit account selections continue to work.
- Missing or disabled explicit accounts fail before provider mutation.
- Conflicting or channel-mismatched account choices fail clearly.
- Unscoped broadcasts build a host-owned route plan without exposing SecretRefs.
- Route bindings survive provider settlement, so retries are not redirected while an effect may still be in flight.

That last point is especially useful for delivery systems. Retries are a fact of life, and a retry should not silently move to a different account because maintenance, capacity eviction, or default-account changes happened while the original effect was settling.

## Verification

The PR includes a large focused test run: 341 exact-head tests passed across Gateway send and route behavior, Gateway maintenance, plugin dispatch, agent message tools, Feishu account tools, and shared account validation. The changed-surface gate also passed formatting, typechecks, lint, SDK and plugin boundaries, import-cycle checks, and state/security guards.

Live Slack proof used a real inbound event, production Gateway, production provider client, and provider-side history verification. The maintainers verified that nonexistent, disabled, and missing direct account selections produced zero provider mutations, while valid explicit routing produced exactly one mutation.

Live Feishu proof covered two distinct app identities and confirmed that valid default, explicit, contextual, and unlisted-default selections crossed the provider boundary, while malformed, unknown, and disabled selections did not.

## Bottom Line

[PR #113417](https://github.com/openclaw/openclaw/pull/113417) makes OpenClaw's channel routing stricter where precision matters most. Explicit account choices now behave like a real boundary: either the selected account is valid for the route, or the action fails before it can send from the wrong identity.
