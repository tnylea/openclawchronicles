---
title: "OpenClaw Gateway Status and Pairing UX Get a Major Cleanup"
excerpt: "Six PRs merged to OpenClaw main on April 20 sharpen gateway capability reporting, device pairing guidance, and channel send reliability."
coverImage: '/assets/images/posts/openclaw-2026-4-20-gateway-pairing-polish.webp'
date: '2026-04-20T08:05:00.000Z'
dateFormatted: April 20th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-20-gateway-pairing-polish.webp'
---

This morning's wave of pull requests landing in OpenClaw's main branch tells a consistent story: the team is methodically cleaning up the rough edges in gateway status reporting, device pairing UX, and channel send reliability. No single change is earth-shattering — but together, they represent a meaningful step forward in day-to-day usability.

Here's what landed on April 20.

## Gateway Probe: Capability vs. Reachability

[PR #69215](https://github.com/openclaw/openclaw/pull/69215) — **Split gateway probe capability from reachability** — is the headline improvement for `openclaw gateway status` users.

Previously, the gateway probe bundled two distinct signals into one: whether the gateway is reachable, and what it's capable of doing (read-only vs. read-write). Conflating these made it harder to diagnose subtle auth problems — you'd get a "gateway OK" result even when you only had limited access.

The new implementation introduces a `GatewayProbeCapability` type and a dedicated `resolveGatewayProbeCapability` function. Status output now clearly separates connectivity from capability, so you can tell at a glance whether your gateway is reachable *and* whether you have the access level you expect.

## Better Pairing Error Messages During Reconnects

[PR #69221](https://github.com/openclaw/openclaw/pull/69221) — **Explain pairing scope upgrades during reconnects** — makes the reconnect experience less confusing when a scope upgrade is required.

When a device reconnects to a gateway that now requires a higher permission level, OpenClaw previously surfaced a somewhat cryptic error. This PR adds clear explanatory text describing why a scope upgrade is happening and what the user needs to do. Combined with [PR #69227](https://github.com/openclaw/openclaw/pull/69227) — **Fix pairing-required recovery details** — the error recovery path during pairing failures is now much cleaner and more actionable.

## `openclaw doctor` Now Detects Pairing Auth Drift

[PR #69210](https://github.com/openclaw/openclaw/pull/69210) — **Surface device pairing auth drift in doctor** — adds a new health check to `openclaw doctor` that notices when a paired device's current permissions no longer match what the gateway expects.

This is particularly useful for long-running setups where permissions have evolved over time — paired devices that worked fine months ago may have drifted out of sync without any obvious signal. Doctor now surfaces this proactively, pointing you toward the fix before it becomes a real problem.

## Slack Send Path: Tolerates Unresolved SecretRefs

[PR #68954](https://github.com/openclaw/openclaw/pull/68954) by [@openperf](https://github.com/openperf) — **Tolerate unresolved channel SecretRef on outbound send path** — fixes a frustrating edge case where Slack sends would fail if a channel's credentials were configured via `SecretRef` and hadn't resolved yet at send time.

The fix introduces a tolerant mode for the outbound path, so transient SecretRef resolution delays don't block message delivery. The strict mode required for inbound auth is preserved.

## Telegram: Numeric IDs Only in Setup

[PR #69191](https://github.com/openclaw/openclaw/pull/69191) — **Require numeric allowFrom ids in setup** — simplifies Telegram onboarding by removing the `@username` → numeric ID resolution path entirely.

The underlying Bot API lookup was never reliably supported for DM users. Rather than paper over a broken feature, the PR removes it entirely and updates docs to be explicit: `allowFrom` takes numeric sender IDs only. It's a cleaner contract, and the documentation now reflects reality instead of a best-effort approximation.

## Still Heading to a Release

All of these are merged to `main` but not yet in a numbered release. The most recent stable is [v2026.4.15](https://github.com/openclaw/openclaw/releases/tag/v2026.4.15). If you're on beta or building from source, these improvements are available now. Watch the [releases page](https://github.com/openclaw/openclaw/releases) for the next tag.
