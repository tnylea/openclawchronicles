---
title: "OpenClaw Keeps Gateway Logins Separate"
excerpt: "OpenClaw now scopes Control UI device credentials per gateway endpoint, preventing same-origin routes from overwriting each other."
coverImage: '/assets/images/posts/openclaw-2026-7-7-gateway-login-isolation.png'
date: '2026-07-07T08:10:00.000Z'
dateFormatted: July 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-7-gateway-login-isolation.png'
---

OpenClaw merged [PR #101352, "fix(ui): preserve login across same-origin gateways"](https://github.com/openclaw/openclaw/pull/101352), a P1 Control UI authentication fix for operators who run multiple gateways behind the same HTTPS origin.

The bug showed up when different gateways lived under different paths or query routes on one host. A browser tab for one gateway could reuse another gateway's cached device token, fail the handshake, and show the login gate again even though the shared gateway token itself had not changed.

## What Changed

The browser now stores gateway-issued device credentials under the exact normalized endpoint. That scope includes protocol, host, path, and query, while excluding the fragment.

That means two gateways on the same origin can keep separate device-bound credentials:

- `https://example.com/rosita`
- `https://example.com/wilfred`
- `https://example.com/control?gateway=rosita`

Device identity can still be shared, but each gateway now reuses only the token that gateway issued. During upgrade, OpenClaw claims the old origin-wide record for the first gateway that opens, migrates it to the exact endpoint scope, then deletes the legacy record so sibling routes cannot consume it.

## Why It Matters

Multi-gateway layouts are common for people running separate OpenClaw agents, environments, or access boundaries behind one domain. A login cache that is too broad can make those deployments feel flaky: one route works, another route reloads, and suddenly a user sees an auth prompt that looks like a token rotation or gateway outage.

The PR narrows that failure mode. Reloading one Control UI route should no longer overwrite a sibling route's cached device credential. Updates and restarts should also be less likely to masquerade as auth churn when the actual issue is a mismatched device token.

## Security Boundary

The PR explicitly keeps the master gateway token out of persistent browser storage and avoids broadcasting it between tabs. Fresh tabs still rely on revocable, gateway-issued, device-bound credentials.

That is the right shape for this class of fix: make the cache more precise without turning a convenience credential into a broader bearer secret.

## Validation

The PR reports regression coverage for same-origin path routes, query routes, legacy record migration, and cleanup-failure handling. It also reports a Chromium end-to-end test proving an independently opened tab reconnects with the gateway-issued device token rather than showing the login gate.

The author also lists a full Control UI suite run: 141 files and 2,287 tests passed, plus focused auth/settings coverage, type-aware lint, Chromium E2E, and production builds.

## Bottom Line

OpenClaw's Control UI now treats each gateway endpoint as its own credential scope. Operators can keep multiple gateways under one origin without one login silently poisoning another.
