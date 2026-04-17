---
title: "OpenClaw Fixes OAuth Token Refresh Race in Multi-Agent Setups"
excerpt: "A new cross-agent file lock in OpenClaw serializes OAuth token refreshes, eliminating the refresh_token_reused storms that plagued large Codex deployments."
coverImage: '/assets/images/posts/openclaw-2026-4-17-oauth-multi-agent-refresh-fix.png'
date: '2026-04-17T08:00:00.000Z'
dateFormatted: April 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-17-oauth-multi-agent-refresh-fix.png'
---

Multi-agent OpenClaw deployments — particularly those running large pools of Codex agents against a shared GitHub Copilot OAuth profile — have long been plagued by a subtle but disruptive failure mode. A new fix merged today puts an end to it.

[PR #67876](https://github.com/openclaw/openclaw/pull/67876), contributed by visionik and co-authored with HeroSizy, lands a cross-agent OAuth refresh serialization layer that resolves the long-tracked issue [#26322](https://github.com/openclaw/openclaw/issues/26322).

## The Problem: Refresh Token Storms

When a shared OAuth token expires and multiple agents hold it simultaneously, every agent races to refresh it at the same time. Providers like GitHub rotate the refresh token on each successful call, which means only the *first* agent's refresh wins. Every other agent receives a `refresh_token_reused` HTTP 401 — and cascades into model fallback, even though fresh credentials are now available.

For anyone running 10–20 Codex agents sharing a single Copilot profile, this created a token-expiry storm roughly every 12 hours: a burst of cascading fallback errors that required manual recovery.

## The Fix: Three Layers of Serialization

The solution stacks three distinct serialization mechanisms:

**1. Cross-process file lock**  
A new lock path at `$STATE_DIR/locks/oauth-refresh/sha256-<hex>` ensures that agents across separate OS processes queue up on a single coordination point before touching a shared profile's token. The lock key now includes both the provider name and the profile ID (NUL-separated to prevent concatenation collisions), so distinct providers never needlessly block each other.

**2. In-process Promise queue**  
Within a single OpenClaw process, a keyed Promise chain prevents concurrent async calls from slipping past the file lock simultaneously — a scenario that's easy to hit in the async JS runtime when many tool calls land at once.

**3. Credential mirroring with identity validation**  
After a successful refresh, the fresh credential is mirrored back into the main-agent store. Peers that acquire the lock afterward skip their own HTTP refresh and *adopt* the already-fresh credential instead. This collapses N serialized refreshes into **1 real refresh + (N-1) cheap adoptions**.

A new `isSafeToCopyOAuthIdentity` gate guards the mirror and adoption paths: it allows credential copies only when there is no positive identity mismatch *and* the incoming credential carries at least as much identity evidence (`accountId`, `email`) as the existing entry. This prevents a misconfigured sub-agent from overwriting the main store with foreign-account tokens — closing a CWE-284-class authorization issue that Aisle flagged during review.

## Lock Timeout Safety

The file lock carries a 3-minute stale timeout (`stale = 180,000ms`). A hard `OAUTH_REFRESH_CALL_TIMEOUT_MS = 120,000ms` cap on the underlying HTTP call guarantees the invariant: every legitimate refresh completes before the lock can be reclaimed by a waiting peer. The two constants are explicitly tested to enforce the `call_timeout < stale` relationship.

## Who Is Affected?

This fix is most impactful for:

- **Multi-agent Codex setups** — 10+ `openai-codex` agents sharing a GitHub Copilot OAuth profile
- **Team deployments** — isolated agent sessions that share a single provider account
- **Automated pipelines** — long-running agent pools with periodic token expiration

Single-agent installs will see no behavioral change. The lock overhead is negligible for the common case.

## Test Coverage

The PR ships 80+ new tests across 11 files, including seeded-RNG fuzz suites covering ~4,500 adversarial inputs. The headline test — `oauth.concurrent-20-agents.test.ts` — fires 20 agents simultaneously against a single profile and asserts that exactly one HTTP refresh call fires while all 20 agents receive the same fresh token. Lock path safety is validated against 2,700+ adversarial profile ID inputs.

The fix is available in the current main branch and will ship in the next OpenClaw release.
