---
title: "OpenClaw Keeps Tailscale Users Online During GitHub Limits"
excerpt: "OpenClaw now keeps verified Tailscale GitHub users in the Control UI when GitHub rate limits profile checks."
coverImage: '/assets/images/posts/openclaw-2026-10-6-tailscale-github-rate-limit.png'
date: '2026-10-06T23:05:00.000Z'
dateFormatted: October 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-6-tailscale-github-rate-limit.png'
---

OpenClaw merged a P1 Gateway fix tonight for a sharp self-hosting failure: verified Tailscale Serve users could be locked out of the Control UI whenever GitHub started rate limiting profile verification.

The fix landed in [PR #166254](https://github.com/openclaw/openclaw/pull/166254), "fix(gateway): verified Tailscale GitHub users are locked out of the Control UI during GitHub rate limits." It is security-sensitive, but the user-facing story is simple. If OpenClaw has already verified the exact GitHub login behind a Tailscale identity, a temporary GitHub rate limit should not make the whole UI disappear.

## What Was Going Wrong

Tailscale GitHub sign-ins resolve a live GitHub profile on connection and authenticated HTTP requests. That is good for freshness, especially when a GitHub login may be renamed or reassigned.

The weak point was outage behavior. The Cloudflare Access path already had a retryable-error fallback for a previously verified profile. The Tailscale path did not. If GitHub's anonymous API quota ran out, previously verified Tailscale users could see "Models unavailable," lose sessions and profile state, and hit a generic retry loop until GitHub's reset.

The PR notes that this could happen even though the Gateway had already verified the same person earlier.

## The New Fallback

OpenClaw now reuses the profile behind the exact `github-login` alias that the Gateway wrote during the last successful verification, but only during retryable GitHub failures.

There are important boundaries:

- A login OpenClaw has never verified still fails closed.
- A renamed or reassigned login is refused once a later successful lookup has moved the binding.
- The reuse applies to the exact canonical login held by the stored profile.
- The rate-limit message now carries GitHub's real reset deadline instead of a generic one-second retry.

That shape gives Tailscale users continuity without pretending a fresh GitHub check happened.

## Why Operators Should Care

This matters most for self-hosted OpenClaw setups that put the Control UI behind Tailscale Serve and use GitHub identities for access.

GitHub rate limits are not rare in active Gateways. The PR points to shared quota pressure from PR status polling, `github.preview`, and uncached per-request Tailscale identity lookup. Once the quota is exhausted, every unnecessary re-check makes recovery noisier.

With the fix, a previously verified user can continue using the Control UI through the outage or rate-limit window. A new or unverifiable user still waits for GitHub, and now gets a clearer "GitHub is rate limiting profile verification" response with the reset time.

## The Security Trade-Off

The PR is explicit about the residual risk. Unlike Cloudflare's fallback, which is keyed to an immutable account ID, the Tailscale fallback is keyed to a GitHub login. GitHub logins can be renamed and later reused.

The accepted bound is narrow: the attacker would need tailnet admission, a GitHub rename-and-reuse race, and a simultaneous GitHub outage before the Gateway sees the rename. Any successful lookup after a rename or reassignment updates the binding and refuses the old login.

For a Tailscale-backed self-hosted system, that is a reasonable availability trade-off with a visible fail-closed boundary for unknown identities.

## Evidence From the Merge

The PR includes real Gateway tests with real Tailscale ingress and connection paths while stubbing `api.github.com`. On the old path, a reconnecting verified user received `UNAVAILABLE` from `users.self` during the rate limit. On the new path, the same user kept their profile and `sessions.list` worked.

The reassignment test is the more interesting one. After GitHub reported one account renamed and another login reassigned, the old login was refused during the rate limit, the reassigned login reached only the new account's default guest role, and the renamed owner kept the original profile and scopes.

The author also included a live Control UI proof with headless Chromium. Before the fix, the UI showed restoring profile state and unavailable models. After the fix, the same verified user stayed online and models loaded during the same simulated GitHub rate limit.

## Bottom Line

OpenClaw is tightening a real operator workflow here. A GitHub quota spike should not strand a user whose Tailscale identity was already verified, and the fix keeps that continuity bounded by exact login history instead of broad trust.
