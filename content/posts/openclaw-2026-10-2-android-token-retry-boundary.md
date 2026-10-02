---
title: "OpenClaw Android Tightens Token Retry Rules"
excerpt: "OpenClaw PR #163347 stops Android from retrying stored device tokens after explicit Gateway denial, tightening reconnect behavior."
coverImage: '/assets/images/posts/openclaw-2026-10-2-android-token-retry-boundary.png'
date: '2026-10-02T08:03:00.000Z'
dateFormatted: October 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-2-android-token-retry-boundary.png'
---

OpenClaw Android received a subtle but important reconnect hardening change in [PR #163347](https://github.com/openclaw/openclaw/pull/163347), titled "refactor(apps): drop more pre-July-2026 app migrations." The merged PR removes an old inference path that could cause Android to retry a stored device token even after a current Gateway explicitly denied that retry.

The PR is labeled P2 and compatibility-risk, not a security advisory. Still, the boundary is worth covering because it sits directly on the trust line between a mobile client and the Gateway it is reconnecting to.

## What Was Wrong

According to the PR, Android still inferred a stored-device-token retry from pre-March-2026 Gateway errors. That fallback could remain active even when a modern Gateway returned an explicit denial.

The practical failure mode was specific: an explicit `false` plus credential-repair advice already paused reconnect, but the older mismatch-code fallback could still arm a pending device-token retry. If the user then selected Retry, Android attached the stored token on the next connection attempt.

That is not the behavior a Gateway operator wants. If the Gateway says the retry is denied, manual reconnect should not resurrect an older inference rule.

## The New Rule

The fix makes Android consume the current `canRetryWithDeviceToken` Boolean directly. July 2026 and newer Gateways keep their trusted, bounded retry behavior. A denied retry stays denied, including after the user manually selects Retry.

Connections from pre-July-2026 versions no longer receive the old code-only device-token retry inference. The PR's user-impact section is clear: those older Gateways should be updated first. No stored credentials or database schemas change.

That is a reasonable cutoff. The PR notes that the support window starts July 1, 2026, and that the oldest supported `v2026.7.1-beta.1` and current Gateway already serialize the explicit Boolean. In other words, Android can stop guessing because supported Gateways now state the retry policy directly.

## Why It Matters

OpenClaw has been steadily retiring pre-July migration and compatibility paths as the project tightens its supported upgrade window. This Android change is a good example of why that work matters.

Backward compatibility is useful until it becomes ambiguous. Here, the older fallback made the client infer permission from an error shape rather than honoring the Gateway's current explicit response. Removing that inference makes reconnect behavior easier to reason about and harder to accidentally broaden.

It also keeps the endpoint-trust, token-presence, and retry-budget checks that already existed. The change is not a new token system; it is a cleanup that makes the modern one authoritative.

## Validation

The PR reports that a negative WebSocket control failed on the original production behavior: manual reconnect attached a stored token after explicit denial. The candidate passed all 173 tests across `GatewaySessionInvokeTest`, `GatewaySessionReconnectTest`, and `GatewayBootstrapAuthTest`, plus Android ktlint.

The release-note context is compact: upgrades or connections from pre-July-2026 versions no longer get the old code-only retry inference. July and newer trusted retries continue, and explicit denial remains authoritative through manual reconnect.

For Android users on supported Gateway versions, that is the right trade: fewer legacy guesses, clearer retry authority, and no credential or schema migration.
