---
title: "OpenClaw Patches WebSocket Shared-Auth Bypass on Main"
excerpt: "A fix merged to OpenClaw main closes a WebSocket auth bypass where supplying any device token alongside shared credentials disabled brute-force rate limiting."
coverImage: '/assets/images/posts/openclaw-2026-3-31-gateway-auth-brute-force-fix.png'
date: '2026-03-31T08:00:00.000Z'
dateFormatted: March 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-31-gateway-auth-brute-force-fix.png'
---

A security fix has landed on OpenClaw's `main` branch that closes a meaningful brute-force protection bypass in the WebSocket gateway handshake. The fix was contributed by [@vincentkoc](https://github.com/vincentkoc) in [PR #57647](https://github.com/openclaw/openclaw/pull/57647) and is not yet in a stable release — the latest stable remains v2026.3.28.

## What Was the Vulnerability?

OpenClaw's WebSocket gateway supports two credential types: shared-auth (a shared secret/password) and device tokens (per-device paired keys). The gateway applies rate limiting to shared-secret login attempts to prevent brute-force guessing.

The bug: if a connecting client supplied **any** `deviceToken` field alongside their shared credentials, the `rateLimiter` was conditionally passed as `undefined` into the shared-auth check. This silently disabled brute-force tracking entirely. An attacker could include a bogus device token in every handshake request and make unlimited guesses at your shared gateway password with no lockout.

The vulnerable pattern in `auth-context.ts` was a single conditional expression:

```
hasDeviceTokenCandidate ? undefined : params.rateLimiter
```

That `? undefined` was the bypass.

## What the Fix Does

[PR #57647](https://github.com/openclaw/openclaw/pull/57647) makes two targeted changes:

1. **Always pass the rate limiter** into the shared-auth check, regardless of whether a device token was also supplied. The conditional is removed entirely.
2. **Reset the shared-secret rate-limit scope** after a successful device-token authentication when shared credentials were also present in the same handshake. This ensures a successful device-token login doesn't leave a dirty shared-auth rate-limit state that could interfere with subsequent sessions.

The fix comes with new end-to-end tests in `auth-context.state.test.ts` that directly exercise both the brute-force bypass scenario and the shared-secret scope reset.

## Who Is Affected?

This vulnerability applies if:

- Your OpenClaw gateway is accessible over the network (local or internet-facing)
- You use **shared-auth** (`gateway.auth.sharedSecret` or similar)

If you only use device-token pairing and have never configured a shared secret, this does not apply to you.

## What to Do

**Before the next stable release:** If your gateway is internet-facing and uses shared-auth, consider temporarily restricting access (firewall rules, Tailscale, VPN), or build from the `main` branch to pick up the fix. The PR has been merged and the fix has a confidence score of 5/5 from the automated review.

**After the next stable release:** Update to whatever version ships after v2026.3.28 — the fix will be included.

## Broader Context: Auth Hardening Continues

This fix follows a pattern of tightening OpenClaw's gateway auth surface. The v2026.3.28 release included a separate security audit that extended web search key detection across Gemini, Grok/xAI, Kimi, and OpenRouter credentials. The project appears to be in a sustained hardening cycle. If you're running an internet-exposed gateway, it's worth staying current.

The full change is visible at [openclaw/openclaw#57647](https://github.com/openclaw/openclaw/pull/57647).
