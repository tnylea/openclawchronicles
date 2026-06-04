---
title: "OpenClaw v2026.5.16-beta.1: Localization, Skill Caching, and 30+ Fixes"
excerpt: "OpenClaw v2026.5.16-beta.1 ships CLI localization for Chinese speakers, a warm-gateway skill cache for faster turns, and over 30 bug fixes across Telegram, Discord, Codex, and more."
coverImage: '/assets/images/posts/openclaw-2026-5-16-beta-1-release.webp'
date: '2026-05-16T08:00:00.000Z'
dateFormatted: May 16th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-16-beta-1-release.webp'
url: '/posts/openclaw-2026-5-16-beta-1-release/'
---

OpenClaw tagged [v2026.5.16-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.1) in the early hours of Saturday, May 16th — a substantial beta that brings internationalization to the setup wizard, a meaningful performance optimization for skill-heavy installations, and a flood of targeted fixes across nearly every channel adapter in the runtime.

## CLI Localization for Chinese Speakers

The biggest headline feature this cycle is **localization of the setup wizard and bundled channel setup flows**. Thanks to contributor [@GaosCode](https://github.com/GaosCode), OpenClaw's onboarding experience now ships in English, Simplified Chinese, and Traditional Chinese out of the box ([#80645](https://github.com/openclaw/openclaw/pull/80645)).

This is more than a translation pass — the entire interactive setup flow has been wired to locale detection, meaning first-time users on Chinese-language systems will see native-language prompts without any configuration. It's a meaningful signal that OpenClaw's community has grown well beyond English-speaking markets.

## Skill Cache for Warm Gateway Turns

On the performance front, [@solodmd](https://github.com/solodmd)'s [PR #81451](https://github.com/openclaw/openclaw/pull/81451) introduces **caching for hydrated `resolvedSkills` across warm gateway turns**. The cache key is the redacted effective config, which means skill snapshots are reused across consecutive turns in the same session without crossing config-gated skill boundaries.

In practice, installations with many skills loaded should see measurable reductions in turn latency — the runtime no longer rebuilds the full skill snapshot from scratch on every message.

## Telegram Gets Ambient Room Awareness

A new opt-in Telegram group chat mode lands via [PR #81317](https://github.com/openclaw/openclaw/pull/81317): `messages.groupChat.ambientTurns: "room_event"`. When enabled, always-on ambient conversation runs as quiet room context, and the agent only speaks visibly when it explicitly uses the message tool. This is a long-requested mode for users who want OpenClaw present in a group chat without it responding to every message it can see.

## Crabbox AWS Config Change

Maintainers take note: Crabbox skill defaults are now **routed through the repo's brokered AWS config** rather than using Blacksmith Testbox as the broad-proof default. Blacksmith Testbox remains available as an explicit opt-in. No action needed for most users, but CI pipelines that relied on implicit Blacksmith routing for skill testing should be updated.

## Notable Fixes

This release closes out a long list of reported issues. A few highlights:

**Cron and scheduling:**
- Cron now honors configured subagent model fallbacks for isolated scheduled runs, including forwarding that policy into embedded agent timeout failover. Fixes [#74985](https://github.com/openclaw/openclaw/issues/74985).
- Failed isolated-agent runs no longer mark successful result delivery when only the failure notification was sent. Fixes [#72985](https://github.com/openclaw/openclaw/issues/72985).

**Codex and MCP:**
- User MCP servers can now be scoped to specific OpenClaw agent IDs via an optional `mcp.servers.<name>.codex.agents` list ([#82180](https://github.com/openclaw/openclaw/pull/82180)).
- `codex.defaultToolsApprovalMode` (auto/prompt/approve) is now accepted for native Codex approval defaults. OpenClaw strips the `codex` block before passing config to Codex.

**Security and input validation:**
- The runtime now **sniffs input file bytes before trusting declared MIME headers**, rejecting spoofed image or zip payloads before they reach agent-visible text.
- Plugins: malformed `package.json` `openclaw.extensions` metadata is now rejected during install, discovery, and post-update payload smoke — no more silently dropped invalid entries.
- Config persistence now ignores malformed array/scalar auth profile, cron job state, and session store entries instead of hydrating them into bad IDs or invalid records.

**Telegram:**
- Drain queued outbound deliveries after polling reconnect confirms fresh `getUpdates` activity. Fixes the long-standing [#50040](https://github.com/openclaw/openclaw/issues/50040).
- Mark isolated polling ingress unhealthy when a spooled inbound backlog stalls while Bot API polling still succeeds. Fixes [#82175](https://github.com/openclaw/openclaw/issues/82175).
- The Telegram stream preview now retains longer partial content rather than replacing a complete answer with an ellipsis-truncated snapshot. Fixes [#82239](https://github.com/openclaw/openclaw/issues/82239).

**Discord:**
- Message-read results are now validated before normalizing channel history, preventing `map is not a function` crashes. Fixes [#82252](https://github.com/openclaw/openclaw/issues/82252).

**macOS:**
- Legacy `ai.openclaw.update.*` LaunchAgents are now disarmed when `openclaw update` starts from one, preventing KeepAlive relaunch loops. Fixes [#82167](https://github.com/openclaw/openclaw/issues/82167).

**Gateway/approvals:**
- A long-standing APPROVAL_CLIENT_MISMATCH bug affecting webchat and control-UI backend replays is fixed. `turnSourceTo` is now correctly treated as optional in `canBridgeNoDeviceChatApprovalFromBackend`. Fixes [#82132](https://github.com/openclaw/openclaw/issues/82132).

**LINE:**
- Webhook events are now acknowledged before agent processing, so slow model replies no longer cause `request_timeout` failures. Fixes [#65375](https://github.com/openclaw/openclaw/issues/65375).

## Contributor Count

This release drew contributions from **46 community members** — one of the larger contributor pools for a single beta tag. Notable first-time contributors include [@GaosCode](https://github.com/GaosCode) (localization), [@obviyus](https://github.com/obviyus) (Telegram ambient turns), and [@bryanbaer](https://github.com/bryanbaer) (gateway lifecycle hook budgets).

## Updating

```bash
openclaw update
```

As always, run `openclaw doctor` after updating to catch any config migrations. The full changelog is on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.1).
