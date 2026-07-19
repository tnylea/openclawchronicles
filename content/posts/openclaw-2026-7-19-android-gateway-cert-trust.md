---
title: "OpenClaw Android Improves Public Gateway Cert Trust"
excerpt: "OpenClaw Android now trusts eligible public Gateway certificates while preserving explicit pinning for LAN and discovered endpoints."
coverImage: '/assets/images/posts/openclaw-2026-7-19-android-gateway-cert-trust.png'
date: '2026-07-19T08:03:00.000Z'
dateFormatted: July 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-19-android-gateway-cert-trust.png'
---

OpenClaw's Android app is getting a cleaner trust path for public Gateway hosts. [PR #110976](https://github.com/openclaw/openclaw/pull/110976), `feat(android): platform trust for public gateway certs + manual fingerprint pinning`, merged at 07:48 UTC on July 19 and targets a very specific source of security friction.

Before this change, Android pinned a TLS fingerprint for every Gateway, including hosts with publicly valid certificates. That made sense for LAN and discovery-based endpoints, but it was painful for public hosts such as Tailscale Funnel gateways with Let's Encrypt certificates. Every certificate renewal could trigger another changed-fingerprint prompt.

## What Changed

The Android app now performs a real system-trust handshake before prompting for a fingerprint on eligible public hosts. The PR says that path uses the platform CA store, HTTPS hostname verification, and SNI. If the certificate chain validates and the hostname matches, Android connects with platform trust instead of storing a pin.

The candidate classifier is intentionally conservative. It rejects `.local` names, IP literals, single-label hosts, and malformed hostnames, keeping LAN-style endpoints on the existing trust-on-first-use pinning flow.

That distinction is the heart of the change. A public DNS hostname with a real CA-issued certificate is not the same trust problem as an attacker-controllable LAN advertisement.

## Existing Pins Still Win

The PR is careful about already-pinned gateways. A valid public chain does not silently clear a user's stored pin. If a pinned public host presents a different certificate that is system-trusted, the changed-pin prompt now includes an explicit one-time choice to use system trust.

Replacing a pin still requires explicit confirmation. Malformed stored pins now fail closed at handshake time instead of degrading silently.

This is the right security tradeoff. The app removes repeated prompts where public certificate renewal should be routine, but it does not train users to ignore a pin mismatch or let a different discovery source become identity.

## Manual Pinning Gets An Escape Hatch

The change also helps cases where the TLS probe cannot capture a certificate. The trust dialog can now accept a pasted SHA-256 fingerprint from the Gateway host. It tolerates common formats such as `sha256:` prefixes, colons, whitespace, and mixed case, but requires a valid 64-hex fingerprint before enforcing it on connect.

For operators in awkward network environments, that is better than the old dead end. It gives them a verifiable out-of-band path without weakening the default flow.

## Evidence

The PR reports green Android coverage across `GatewayTlsTest`, `GatewayBootstrapAuthTest`, and `GatewaySessionCustomHeadersTest` on both Play and ThirdParty flavors. Those tests cover the trust-decision matrix, candidate classifier, fingerprint normalizer, probe-budget splitting, bootstrap auth, and custom headers.

It also passed ktlint, Android i18n checks, and `git diff --check`. The new user-facing strings were translated across all 21 locales.

## Operator Takeaway

Public Gateway hosts should feel less noisy on Android after this merge. Certificate renewals can work like normal HTTPS renewals, while LAN, IP, and discovered endpoints keep the stricter pinning behavior that protects local credentials from spoofed advertisements.
