---
title: "OpenClaw Smooths Trusted-Proxy Scope Upgrades"
excerpt: "OpenClaw trusted-proxy gateways can now auto-approve same-key browser scope upgrades while preserving operator caps and key checks."
coverImage: '/assets/images/posts/openclaw-2026-7-20-trusted-proxy-scope-upgrades.png'
date: '2026-07-20T23:02:00.000Z'
dateFormatted: July 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-20-trusted-proxy-scope-upgrades.png'
---

OpenClaw merged a Gateway authentication improvement tonight for teams that run Control UI behind a trusted proxy such as Cloudflare Access. [PR #111916](https://github.com/openclaw/openclaw/pull/111916), titled "fix(gateway): auto-approve trusted-proxy same-key device scope upgrades," removes a frustrating approval dead end without broadening the trust model.

The bug appeared when an already-paired browser device requested additional scopes within the operator's configured trusted-proxy auto-approval set. The Gateway treated every known-device re-request as suspicious and left the browser on a "scope upgrade pending" path. In practice, users could get stuck until someone ran `openclaw devices approve`, and pending requests could expire before that happened.

## What Changed

The new behavior distinguishes between a risky device ID collision and the same browser proving possession of the same key again. In the trusted-proxy flow, the connect handshake has already proven the device's private key by signature. If the paired record's public key matches the key proven by the new connection, OpenClaw can treat it as the same physical browser.

That same-key browser can now receive an inline scope upgrade, but only inside the operator-configured cap. The PR keeps several boundaries intact:

- Approved scopes are still intersected with `gateway.auth.trustedProxy.deviceAutoApprove.scopes`.
- Roles remain operator-controlled.
- Key mismatches keep the old fail-closed behavior.
- Non-trusted-proxy pairing sources still require the prior manual path.
- The store-level approval guard revalidates the paired key under the pairing lock.

That last point matters for concurrency. If a request races with a key change, the locked store path checks the current paired key again before approving.

## Why It Matters

Trusted-proxy deployments often exist because a team already has an identity layer in front of OpenClaw. A browser user has passed SSO, and the Gateway has a device key relationship with that browser. Forcing a manual approval on every same-device scope expansion adds friction, especially when the requested scopes are already inside the administrator's auto-approval policy.

The improved flow keeps the security decision where it belongs: same key, trusted proxy, configured scope cap. Anything outside that box still falls back to manual approval or rejection.

For team Control UI users, this should make scope upgrades feel less brittle. A legitimate browser can reconnect with additional allowed scopes without waiting on an expiring manual approval banner.

## Proof From The PR

The PR adds Gateway and device-pairing regression coverage. The trusted-proxy server test now proves inline approval for a paired device scope upgrade and verifies that no pending request remains. A separate test proves that a foreign-key connect for an existing device ID is rejected with the paired record untouched.

The lower-level pairing store tests cover same-key trusted-proxy upgrade approval, key-mismatch decline, and non-trusted-proxy known-device decline. The PR reports 11 Gateway trusted-proxy tests passing, 62 device-pairing tests passing, sibling auth/browser hardening suites passing, and a clean high-confidence autoreview.

This is a good example of a smoother OpenClaw UX that still preserves the underlying authentication boundary.
