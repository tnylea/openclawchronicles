---
title: "OpenClaw Goes Modular: Copilot and Tokenjuice Are Now Official Plugins"
excerpt: "OpenClaw 2026.5.30-beta.1 externalizes GitHub Copilot and Tokenjuice as install-on-demand plugins, making the core leaner and integrations more flexible."
coverImage: '/assets/images/posts/openclaw-2026-5-31-copilot-tokenjuice-plugins.webp'
date: '2026-05-31T08:05:00.000Z'
dateFormatted: May 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-31-copilot-tokenjuice-plugins.webp'
---

OpenClaw's beta release this weekend makes a structural change worth understanding: **GitHub Copilot** and **Tokenjuice** are no longer bundled into the OpenClaw core. Both have been externalized as official install-on-demand plugins — `@openclaw/copilot` and `@openclaw/tokenjuice` — available on npm and ClawHub.

## What Changed

Previously, Copilot agent runtime support and the Tokenjuice token management layer shipped as part of the main `openclaw` package. That meant everyone carried their weight whether they used them or not.

With `v2026.5.30-beta.1`, both are fully external:

- **`@openclaw/copilot`** — The GitHub Copilot agent runtime. Lets you use Copilot as the backing model for OpenClaw agents, routing prompts through GitHub's Copilot API with full session and tool support.
- **`@openclaw/tokenjuice`** — Token budget tracking and optimization layer. Helps agents stay within context limits intelligently, with per-session accounting and budget-aware truncation strategies.

Both packages carry npm and ClawHub publish metadata, so they're discoverable and installable through either channel.

## How to Install

If you use either integration, add them explicitly after upgrading:

```bash
# GitHub Copilot agent runtime
openclaw plugins install @openclaw/copilot

# Tokenjuice token management
openclaw plugins install @openclaw/tokenjuice
```

Or install directly from npm if you prefer managing the package yourself:

```bash
npm install -g @openclaw/copilot @openclaw/tokenjuice
```

Existing configs referencing these features should continue to work — OpenClaw resolves missing plugin packages with a clear install prompt rather than a silent failure.

## Why Modular?

The externalization is part of a broader push to keep the OpenClaw core smaller and faster. Hot-path performance improvements in v2026.5.30-beta.1 — reusing provider handles, skipping declaration bundling on runtime-only builds, and cutting startup metadata from CLI profiles — all benefit from a leaner surface area.

For Copilot specifically, the move to a plugin also gives the team a faster release cadence. Copilot API changes or new Copilot model tiers can now ship as plugin updates without requiring a full OpenClaw core release. Same logic applies to Tokenjuice: token accounting strategies can evolve independently.

## The Codex Supervisor Plugin

Alongside the Copilot externalization, the release also ships the **Codex Supervisor plugin** — a new package that enables delegated Codex workflows. Where the standard Codex integration lets you invoke Codex as a sub-agent, the Supervisor plugin adds a management layer: it can orchestrate multiple Codex sessions, track their state, and hand off work between them.

This lands in the same beta and is available as `@openclaw/codex-supervisor` on ClawHub. The real-home app-server MCP session listing, stored history scanning, and clean WebSocket probe teardown are all handled by the Supervisor rather than the core runtime — another example of the same modularity principle at work.

## ClawHub Gets Smarter About Plugins

The beta also adds **plugin display names** and **skill verification and trust surfaces** to ClawHub ([#87354](https://github.com/openclaw/openclaw/pull/87354)). This means when you browse ClawHub for plugins, you get clearer labeling about what each plugin does and whether it's verified by the OpenClaw team.

Plugin trust indicators matter more now that the plugin ecosystem is growing. With official packages like `@openclaw/copilot` and community plugins sitting side by side, the verification signal helps you distinguish between the two at a glance.

## What Else Is in v2026.5.30-beta.1

Beyond the plugin externalizations, the beta is a broad reliability release:

- **Channel stability** across Telegram, WhatsApp, iMessage, Slack, Discord, Teams, Google Chat, and iOS Talk
- **Timer bounds** on provider requests, OAuth flows, media downloads, and generated-content polling
- **Cron fixes** for legacy run-log table compatibility and recurring job rate-limit retries
- **Security hardening** rejecting unsafe OAuth lifetimes, retry-after delays, and response body sizes

Full notes: [github.com/openclaw/openclaw/releases/tag/v2026.5.30-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.5.30-beta.1)

## Upgrade Path

The beta is a pre-release. If you run OpenClaw in a production context, wait for the stable `v2026.5.30` tag. For dev and test environments, the beta is solid — the release CI, E2E, and plugin gauntlet are all passing.

```bash
npm install -g openclaw@2026.5.30-beta.1
```

After upgrading, run `openclaw doctor` to catch any configs that reference the old bundled Copilot or Tokenjuice paths — the doctor output should flag them with actionable restart guidance.
