---
title: "OpenClaw v2026.5.27 Is Stable: What Changed from Beta"
excerpt: "OpenClaw v2026.5.27 has graduated from beta to stable release. Here is what to expect, how to upgrade, and what the final diff from beta adds."
coverImage: '/assets/images/posts/openclaw-2026-5-28-v2026527-stable.png'
date: '2026-05-28T23:00:00.000Z'
dateFormatted: May 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-28-v2026527-stable.png'
---

After shipping as a pre-release at 05:54 UTC this morning, [v2026.5.27](https://github.com/openclaw/openclaw/releases/tag/v2026.5.27) has now graduated to stable — the production release tag landed on GitHub at 11:41 UTC. If you held off on the beta, now is the time to upgrade.

## What Was Already Covered

This morning we published a [full breakdown of the beta release](/posts/openclaw-2026-5-28-security-hardening-pixverse), covering all the major highlights:

- Group prompt injection prevention and hostname normalization
- Pixverse video generation provider with API region selection
- Codex app-server reliability improvements (model resolution, memory routing, client survival)
- Gateway and reply path performance improvements
- OpenAI-compatible embedding provider built in
- Per-channel delivery fixes for Telegram, iMessage, Slack, Discord, Google Chat, and Matrix

If you missed that post, start there. This post focuses on what changed between the beta and the stable release.

## What the Stable Release Adds

Comparing the stable release notes against the beta, the additional fixes are primarily in the release engineering and CI layer:

**Package and install hardening:**
- npm globstar exclusions now match correctly so the published tarball contains exactly what is intended
- Dist package exclusions are honored in the inventory check, preventing stale test helpers from shipping
- Nested shrinkwrap override pins now merge correctly — previously, conflicting pin declarations from plugins could produce unpredictable dependency resolutions
- Docker runtime workspace templates are packaged and smoked in CI, catching template drift before it reaches users

**Release verification tightening:**
- Postpublish verification is stricter — the release is not marked complete until all artifacts are confirmed
- Beta smoke now rejects empty runs, preventing silent CI pass on misconfigured environments
- E2E log and probe waits are bounded across Telegram, Open WebUI, ClawHub, Matrix, MCP, and gateway network tests

**QQBot fallback approval buttons:** The stable release also adds explicit gating on QQBot slash-command approval buttons — a missing check that allowed non-slash-command flows to bypass the auth gate in some configurations.

## The npm Package

The stable release is available at:

```
https://www.npmjs.com/package/openclaw/v/2026.5.27
```

Integrity: `sha512-2N93zhdAo88KAbHt6T7KvYXf4s7XIkYXBgv1npYpn7e1Y9FvrtgtpsA38my9rtFW+70uXEojRPX5/OqnuDqJPw==`

The full CI evidence report is at [github.com/openclaw/releases](https://github.com/openclaw/releases/blob/main/evidence/2026.5.27/release-evidence.md).

## How to Upgrade

```bash
openclaw update
```

Or install the stable version directly:

```bash
npm install -g openclaw@2026.5.27
```

The stable release replaces the beta in the default update channel. If you pinned `2026.5.27-beta.1`, the above command will upgrade you to stable.

## Why "Beta → Stable" Matters

OpenClaw ships pre-releases for exactly this reason: catching integration issues before the stable tag. In this case, the QQBot auth gap and the shrinkwrap merge bug were caught between beta and stable. Running on the stable channel means you only land on versions that have cleared full validation, Docker template smoking, and bounded E2E waits — not just the core logic tests.

For most self-hosters, the practical difference between this beta and stable is small. But for anyone running OpenClaw in a shared-household or team environment — where the QQBot fix and tighter approval gating matter — upgrading now is worthwhile.

The [full release notes](https://github.com/openclaw/openclaw/releases/tag/v2026.5.27) are on GitHub.
