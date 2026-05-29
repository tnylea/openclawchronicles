---
title: "OpenClaw v2026.5.28-beta.4: Claude Opus 4.8, GitHub Copilot Runtime, and the Workboard"
excerpt: "Tonight's OpenClaw pre-release lands Claude Opus 4.8 support, a GitHub Copilot agent runtime, Workboard coordination tools, and deep iOS and channel hardening."
coverImage: '/assets/images/posts/openclaw-2026-5-29-opus-48-copilot-runtime.png'
date: '2026-05-29T23:00:00.000Z'
dateFormatted: May 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-29-opus-48-copilot-runtime.png'
---

OpenClaw's nightly pre-release cadence rarely disappoints on Fridays, and tonight's **v2026.5.28-beta.4** — stamped at 22:48 UTC — is no exception. Dropped well after this morning's stable build, it bundles a run of provider expansions, a brand-new agent coordination layer, and some of the most comprehensive channel hardening the project has shipped in a single release.

## Claude Opus 4.8 Is In

The headline for most users: **Claude Opus 4.8 is now a first-class supported model** ([#87845](https://github.com/openclaw/openclaw/pull/87845)). The new model slots directly into OpenClaw's provider catalog alongside the existing Claude Sonnet and Haiku tiers, meaning you can pin your agents to Opus 4.8 for tasks where raw capability matters more than latency or cost. Provider auth and model resolution are covered out of the box — no extra config needed.

Alongside Opus 4.8, the release adds:

- **Fal Krea image model schemas** ([#87890](https://github.com/openclaw/openclaw/pull/87890)) — Fal's Krea models are now schema-validated in the provider layer.
- **NVIDIA featured model catalogs** ([#80775](https://github.com/openclaw/openclaw/pull/80775)) — NVIDIA's model lineup surfaces in OpenClaw's model selection without needing a manual catalog entry.
- **MiniMax streaming music responses** ([#84764](https://github.com/openclaw/openclaw/pull/84764)) — MiniMax's audio generation endpoint now streams results properly.
- **Provider-backed voice model catalogs** ([#87794](https://github.com/openclaw/openclaw/pull/87794)) — Voice model selection is now driven by live provider catalogs rather than static lists.

## GitHub Copilot Runtime and the Codex Supervisor

Two interconnected changes reshape how OpenClaw hands off coding work to external agents. First, the **GitHub Copilot agent runtime** lands as an officially supported harness — OpenClaw can now delegate tasks to Copilot agents using the same ACP-style protocol it uses for Codex. Second, a **Codex Supervisor plugin package** arrives, providing a structured path for delegated Codex workflows where one OpenClaw session orchestrates Codex runs on its behalf.

Both ship as install-on-demand plugins with npm and ClawHub publish metadata, meaning you get them via `openclaw plugins install` rather than as part of the core bundle. The Codex Supervisor keeps real-home app-server MCP session listing on the loaded state path and bounds stored history scans — so it doesn't bloat memory on long-running sessions.

## Workboard: Agent Coordination Built In

A new **Workboard** feature adds agent coordination tools directly to OpenClaw for tracking and handing off active agent work. Think of it as a lightweight shared task surface that sits between your main session and any spawned subagents — useful for multi-agent pipelines where you need visibility into what each agent is doing without leaving your primary context.

## iOS Gets a Full Pro UI Refresh

The iOS companion app receives what the release notes call a "broader refresh": **hosted push relay defaults**, **realtime Talk tab playback** wired to gateway sessions, and the **session picker** now preserves state across reconnects and empty searches ([#87531](https://github.com/openclaw/openclaw/pull/87531), [#87682](https://github.com/openclaw/openclaw/pull/87682), [#88096](https://github.com/openclaw/openclaw/pull/88096), [#88105](https://github.com/openclaw/openclaw/pull/88105)). Credit to [@ngutman](https://github.com/ngutman) and [@Solvely-Colin](https://github.com/Solvely-Colin) for driving this.

## ClawHub: Skill Verification and Trust Surfaces

ClawHub gains **plugin display names** and **skill verification and trust surfaces** ([#87354](https://github.com/openclaw/openclaw/pull/87354)). This means skills published to ClawHub can now carry verified publisher badges visible directly in the OpenClaw UI — the first step toward a signed, trust-graded skill ecosystem.

## Channel Hardening Across the Board

Beta.4 is thorough in its channel fixes. Highlights:

- **Matrix**: Room IDs preserve case correctly.
- **iMessage**: Polling continues after denied reactions.
- **Slack**: Final replies are retained during late cleanup; reasoning previews show correctly.
- **Discord**: Recovered tool warnings are suppressed from mention surfaces; voice outbound helper is preserved.
- **WhatsApp**: Auth directory resolves from the active profile; QR display, document filenames, and plugin hook config are all preserved.
- **Telegram**: SecretRef prompt config and polling keepalives survive restarts.
- **Teams**: Untrusted service URLs are now blocked ([#87160](https://github.com/openclaw/openclaw/pull/87160)).

## Policy and Sandbox Conformance

Three new policy checks land in this build:

1. **Policy comparison** — diff two policy configs side by side.
2. **Ingress-channel conformance** — verify that inbound channel config matches declared policy.
3. **Sandbox-posture conformance** — assert that the current sandbox configuration meets a declared security posture.

([#85572](https://github.com/openclaw/openclaw/pull/85572), [#85744](https://github.com/openclaw/openclaw/pull/85744), [#86768](https://github.com/openclaw/openclaw/pull/86768))

## Getting the Beta

Beta.4 is a pre-release — it won't auto-update stable installs. To pull it manually:

```bash
npm install -g openclaw@2026.5.28-beta.4
```

Or wait for the stable promotion, which typically follows within a day or two of a beta series finishing. Given how much landed in this build, the stable tag for this cycle should be substantial.

Full changelog: [github.com/openclaw/openclaw/releases/tag/v2026.5.28-beta.4](https://github.com/openclaw/openclaw/releases/tag/v2026.5.28-beta.4)
