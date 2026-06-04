---
title: "OpenClaw 2026.4.29: Commitments, People Wiki, and NVIDIA Support"
excerpt: "OpenClaw 2026.4.29 lands with agent commitments, a people-aware memory wiki, NVIDIA provider integration, and a security breaking change for tool profiles."
coverImage: '/assets/images/posts/openclaw-2026-4-30-v2026-4-29-release.webp'
date: '2026-04-30T23:00:00.000Z'
dateFormatted: April 30th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-30-v2026-4-29-release.webp'
---

OpenClaw [v2026.4.29](https://github.com/openclaw/openclaw/releases/tag/v2026.4.29) shipped today — a release dense enough that "highlights" section alone covers five distinct subsystems. Here is what matters and what you need to watch out for before upgrading.

## Inferred Commitments — Agents That Follow Through

The headline feature is the new **commitments system** ([#74189](https://github.com/openclaw/openclaw/pull/74189)). When enabled, OpenClaw can now extract implicit follow-up promises from conversations — phrases like "I'll check in on that tomorrow" or "remind me Friday" — and turn them into scheduled heartbeat deliveries.

The config surface is minimal by design:

```yaml
commitments:
  enabled: true
  maxPerDay: 5
```

Extraction happens in a hidden batched pass, scoped per agent and per channel. Heartbeat-interval due-time clamping prevents commitments from echoing back immediately. It is opt-in for now but signals where the project is heading: agents that don't just respond, but actually follow through.

## Memory Grows Into a People-Aware Wiki

Memory gets a substantial upgrade this release. OpenClaw now maintains an **agent-facing people wiki** with:

- Canonical aliases and person cards
- Relationship graphs between contacts
- Privacy and provenance reports showing where each piece of information came from
- Evidence-kind drilldown (who said what, when, in which conversation)
- Per-conversation `allowedChatIds` / `deniedChatIds` filters for targeted recall

For teams running shared OpenClaw deployments, the provenance reports address a real concern: knowing why the agent thinks it knows something about a person. The **partial recall on timeout** improvement ([#73219](https://github.com/openclaw/openclaw/pull/73219)) is also worth noting — if the memory sub-agent times out, you now get a bounded summary of whatever was recovered rather than losing all context silently.

## NVIDIA Provider Now Available

The NVIDIA provider lands in this release ([#71204](https://github.com/openclaw/openclaw/pull/71204)), joining the existing roster of OpenAI, Anthropic, Bedrock, and others. Setup includes API-key onboarding, a static model catalog, and literal model-ref picker support so you can reference NVIDIA-hosted models with their provider prefix (e.g., `nvidia/llama-3.1-nemotron-70b-instruct`).

Bedrock also gets **Opus 4.7 thinking parity** this release, and Codex/OpenAI-compatible replay and streaming behavior sees several safety fixes.

## ⚠️ Security Breaking Change: Tool Profiles Now Enforced

**This is the one you need to read before upgrading.**

Previously, adding `tools.exec` or `tools.fs` sections to your config would silently widen access even under restrictive profiles like `messaging` or `minimal`. That behavior is gone.

> Configured tool sections (tools.exec, tools.fs) no longer implicitly widen restrictive profiles (messaging, minimal). Users who need those tools under a restricted profile must add explicit `alsoAllow` entries.

A startup warning will identify affected configs, so the migration path is clear — but deployments relying on the old implicit behavior will see tools disabled on first boot. Check your configs. Fixes [#47487](https://github.com/openclaw/openclaw/issues/47487), thanks to [@amknight](https://github.com/amknight).

## Channel Fixes Across the Board

This release clears a long backlog of channel-specific bugs:

- **Slack**: Block Kit limits no longer cause silent failures; bot relay allowlisting now requires explicit channel owner presence ([#59284](https://github.com/openclaw/openclaw/issues/59284))
- **Telegram**: Proxy, webhook, polling, and send resilience all improved
- **Discord**: Startup and rate-limit handling fixed; group turns no longer complete silently when the message tool is unavailable ([#74868](https://github.com/openclaw/openclaw/issues/74868))
- **WhatsApp**: Delivery and liveness improvements
- **Signal**: Group allowlists now match inbound group IDs, not just sender IDs ([#53308](https://github.com/openclaw/openclaw/issues/53308))
- **Yuanbao**: Tencent's Yuanbao channel is now officially documented in the channel listing

## OpenGrep Security Scanning

A new **OpenGrep rulepack** ([#69483](https://github.com/openclaw/openclaw/pull/69483)) ships with PR and full-scan GitHub Actions workflows that validate first-party code changes and upload SARIF results to GitHub Code Scanning. For contributors, this means security-relevant code changes now get static analysis as part of CI.

## Docker and Operations

Two Docker-specific improvements are worth calling out:

- `OPENCLAW_SKIP_ONBOARDING` ([#55518](https://github.com/openclaw/openclaw/pull/55518)) lets automated Docker installs skip interactive onboarding while still applying gateway defaults
- Gateway startup now exits with `sysexits 78` for port conflicts, which maps cleanly to `RestartPreventExitStatus=78` in systemd — so restart loops on occupied ports stop instead of spinning ([#75115](https://github.com/openclaw/openclaw/issues/75115))

## Internationalization Push

New locale support lands for **Persian (fa), Dutch (nl), Vietnamese (vi), Italian (it), Arabic (ar), and Thai (th)** — with matching docs glossaries for fa, nl, vi, and zh-TW. The Control UI language picker now stays aligned with the docs translation pipeline across all surfaces.

## Upgrade Notes

The tools profile change (see above) is the only breaking change confirmed in this release. The commitments and people-wiki features are both opt-in and require explicit config to activate. Everything else is additive or a fix.

Full changelog on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.29).
