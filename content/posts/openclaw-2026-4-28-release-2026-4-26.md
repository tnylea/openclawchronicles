---
title: "OpenClaw 2026.4.26: Cerebras Support, Claude Import, and Realtime Voice"
excerpt: "OpenClaw 2026.4.26 lands with Cerebras as a bundled provider, a first-class migration tool for Claude users, and browser realtime voice."
coverImage: '/assets/images/posts/openclaw-2026-4-28-release-2026-4-26.png'
date: '2026-04-28T08:00:00.000Z'
dateFormatted: April 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-28-release-2026-4-26.png'
---

OpenClaw [2026.4.26](https://github.com/openclaw/openclaw/releases/tag/v2026.4.26) landed overnight with a release that covers a lot of ground: a new bundled AI provider, a proper migration story for users coming from Claude, real-time browser voice transport, and a clean config diff UI. There are also a couple of security fixes worth knowing about.

Here's what matters.

## Cerebras Is Now a Bundled Provider

Cerebras — the company behind ultra-fast inference hardware — is now a first-class bundled provider in OpenClaw, complete with onboarding, a static model catalog, docs, and manifest-owned endpoint metadata. No plugin install required; it shows up during setup like any other built-in provider.

For users who have been waiting for Cerebras's speed advantages inside their local agent stack, this is a straightforward win. Just run `openclaw setup` or add it through the Control UI provider onboarding flow.

## `openclaw migrate`: Import from Claude Code, Claude Desktop, and Hermes

This is the headline feature for anyone coming from the Anthropic ecosystem. A new top-level `openclaw migrate` command provides a full migration path with:

- **Preview and dry-run mode** — see exactly what will change before it happens
- **Pre-migration backup** — your existing config is archived automatically
- **Claude importer** — imports Claude Code and Claude Desktop instructions, MCP servers, skills, command prompts, and safely archives any state that needs manual review
- **Hermes importer** (contributed by [@NousResearch](https://github.com/NousResearch)) — imports configuration, memory/plugin hints, model providers, MCP servers, skills, and supported credentials from Hermes

The importer also detects first-run onboarding state so it doesn't trample a fresh install. Combined with `--dry-run` and `--json` output for scripting, this is a migration tool that was clearly built to be trustworthy, not just functional.

If you've been putting off moving your Claude-based setup to OpenClaw because the process felt manual and risky, that excuse is gone.

## Browser Realtime Voice Transport

OpenClaw now ships a generic browser realtime transport contract that covers Google Live browser Talk sessions with constrained ephemeral tokens, plus a Gateway relay for backend-only realtime voice plugins. A companion fix ensures these sessions stay on WebSocket rather than falling back to WebRTC, and validates endpoint health before connecting.

This lays the groundwork for stable browser-based voice sessions without requiring a separate voice plugin or direct WebRTC peer setup. The Gateway relay path is particularly useful for self-hosters who want server-side audio handling rather than browser-native media APIs.

## Raw Config Diff Panel in the Control UI

A new raw config pending-changes diff panel in the Control UI parses JSON5, redacts sensitive values until you explicitly reveal them, and cleanly avoids triggering fake raw-edit callbacks when you're just reviewing — not saving. It supersedes a couple of older PR attempts that had reliability issues.

This is the kind of UI change that sounds boring until you've accidentally applied a config you didn't mean to. Having a proper diff view before committing changes is a long-overdue quality-of-life improvement.

## Matrix E2EE Setup in One Command

A new `openclaw matrix encryption setup` flow bootstraps Matrix encryption, sets up recovery, and prints verification status — all from a single interactive command. No more hand-rolling the encryption bootstrapping steps that previously required several manual Matrix client operations.

## Security Fixes

Two fixes worth flagging:

**Bearer token echo removed from `device.token.rotate`** ([#66773](https://github.com/openclaw/openclaw/issues/66773)): Shared/admin `device.token.rotate` responses were previously echoing the rotated bearer token back in the response. That's fixed — the token is no longer included in the response while still allowing the same-device token handoff that token-only clients need before reconnecting. Thanks [@MoerAI](https://github.com/MoerAI).

**`subagents.allowAgents` enforcement tightened** ([#72827](https://github.com/openclaw/openclaw/issues/72827)): Explicit `sessions_spawn(agentId=...)` calls targeting the same agent were being auto-allowed, bypassing the `subagents.allowAgents` policy check. This is now enforced consistently. Thanks [@oiGaDio](https://github.com/oiGaDio).

Neither is a critical CVE, but both close real policy bypass vectors — especially relevant if you're running OpenClaw in a multi-user or production environment.

## Other Notable Fixes

The release includes a long tail of quality-of-life fixes across the board:

- **Docker TLS fix** ([#72787](https://github.com/openclaw/openclaw/issues/72787)): The slim Docker image now includes the CA certificate bundle, fixing HTTPS failures in containerized gateways after the bookworm-slim base switch.
- **Bonjour/mDNS hostname conflict** ([#72355](https://github.com/openclaw/openclaw/issues/72355)): The Gateway now defaults mDNS advertisements to the system hostname when DNS-safe, preventing `openclaw.local` probing conflicts on hosts like "Lobster" or "ubuntu".
- **Groq/LM Studio reasoning effort** ([#32638](https://github.com/openclaw/openclaw/issues/32638)): Groq and LM Studio can now declare provider-native reasoning effort values, so Qwen thinking models get `none/default` instead of OpenAI-specific `low/medium` values.
- **WhatsApp proxy support** ([#72547](https://github.com/openclaw/openclaw/issues/72547)): WhatsApp QR-login WebSocket connections now honor `HTTPS_PROXY` / `HTTP_PROXY` gateway env vars, fixing connection failures on proxied networks.
- **Windows/Feishu path normalization** ([#72783](https://github.com/openclaw/openclaw/issues/72783)): Bundled plugin and Feishu sidecar loads on Windows no longer fail with raw `C:` ESM loader URL errors.

## Updating

```bash
openclaw update
```

Full changelog: [github.com/openclaw/openclaw/releases/tag/v2026.4.26](https://github.com/openclaw/openclaw/releases/tag/v2026.4.26)
