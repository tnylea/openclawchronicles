---
title: "OpenClaw v2026.4.2: Task Flow Engine and Android Assistant"
excerpt: "OpenClaw v2026.4.2 lands a fully restored Task Flow substrate, Android Google Assistant launch support, plugin config migrations, and a sweeping provider security overhaul."
coverImage: '/assets/images/posts/openclaw-2026-4-5-v2026-4-2-task-flow-android-assistant.png'
date: '2026-04-05T23:00:00.000Z'
dateFormatted: April 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-5-v2026-4-2-task-flow-android-assistant.png'
---

OpenClaw **v2026.4.2** landed on April 2nd and it's one of the biggest point releases in recent memory. The headline feature is the fully restored **Task Flow substrate** — the background orchestration engine that lets OpenClaw manage long-running, multi-step agent work outside the main chat session. But there's a lot more packed in here, including Android Google Assistant integration, sweeping provider security hardening, and breaking config migrations for the xAI and Firecrawl plugins.

## Task Flow: Background Orchestration Gets Real

The Task Flow engine, first introduced in v2026.3.31 as a scaffolded control plane, is now fully operational. [PR #58930](https://github.com/openclaw/openclaw/pull/58930) by [@mbelinky](https://github.com/mbelinky) restores the core substrate with:

- **Managed vs. mirrored sync modes** — choose whether a Task Flow actively drives child tasks or mirrors an external orchestrator's state
- **Durable flow state and revision tracking** — flows survive gateway restarts; you can inspect and recover them with `openclaw flows` commands
- **Sticky cancel intent** — cancelling a parent flow immediately stops new child tasks from being scheduled, then waits for active children to finish cleanly before the parent settles to cancelled

Two companion PRs complete the picture. [#59610](https://github.com/openclaw/openclaw/pull/59610) adds **managed child task spawning** so external orchestrators can directly spawn subtasks under a parent flow, and [#59622](https://github.com/openclaw/openclaw/pull/59622) adds `api.runtime.taskFlow` as a plugin seam, so trusted authoring layers (skills, plugins) can create and drive Task Flows from host-resolved OpenClaw context without threading owner identifiers through every call.

If you've been waiting for OpenClaw to handle complex multi-step background jobs — data pipelines, scheduled research loops, multi-agent orchestration — this release is the foundation that makes it production-viable.

## Android: Google Assistant Now Launches OpenClaw

[PR #59596](https://github.com/openclaw/openclaw/pull/59596) by [@obviyus](https://github.com/obviyus) adds proper **Android assistant-role entrypoints** plus Google Assistant App Actions metadata to the OpenClaw Android app. In practice this means:

- You can invoke OpenClaw directly via "Hey Google" or by triggering the Assistant
- Prompts spoken to the Assistant get handed into the OpenClaw chat composer
- Third-party app launchers that support App Actions will surface OpenClaw as an assistant target

This is a significant quality-of-life improvement for Android users who want a hands-free, voice-first OpenClaw workflow.

## Breaking: Plugin Config Migrations

Two breaking changes require attention if you're using the xAI or Firecrawl web fetch plugins.

**xAI plugin** ([PR #59674](https://github.com/openclaw/openclaw/pull/59674), by [@vincentkoc](https://github.com/vincentkoc)): The `x_search` settings have moved from the legacy `tools.web.x_search.*` path to the plugin-owned `plugins.entries.xai.config.xSearch.*` path. API key config standardizes on `plugins.entries.xai.config.webSearch.apiKey` or the `XAI_API_KEY` environment variable. Run `openclaw doctor --fix` to migrate automatically.

**Firecrawl web_fetch** ([PR #59465](https://github.com/openclaw/openclaw/pull/59465), by [@vincentkoc](https://github.com/vincentkoc)): Firecrawl config moves from `tools.web.fetch.firecrawl.*` to `plugins.entries.firecrawl.config.webFetch.*`. Same story — `openclaw doctor --fix` handles the migration.

Both changes follow OpenClaw's broader push to move provider-specific config out of the monolithic core `tools.*` namespace and into proper plugin-owned paths. The long-term payoff is cleaner separation, but the short-term pain is config bumps for anyone on these plugins.

## Provider Security Overhaul

[@vincentkoc](https://github.com/vincentkoc) landed a series of five related PRs ([#59682](https://github.com/openclaw/openclaw/pull/59682), [#59644](https://github.com/openclaw/openclaw/pull/59644), [#59542](https://github.com/openclaw/openclaw/pull/59542), [#59469](https://github.com/openclaw/openclaw/pull/59469), [#59433](https://github.com/openclaw/openclaw/pull/59433), [#59608](https://github.com/openclaw/openclaw/pull/59608)) that centralize request authentication, proxy handling, TLS policy, and header shaping across the shared HTTP, streaming, and WebSocket transport paths. Key outcomes:

- **Insecure TLS overrides blocked** — runtime config can no longer relax TLS policy on outbound provider connections
- **Anthropic and OpenAI native endpoint classification centralized** — proxy or spoofed hosts can no longer inherit native provider defaults (service_tier, attribution headers, etc.)
- **Copilot base URL routing fixed** — GitHub Copilot API hosts now resolve correctly via the shared endpoint resolver, preventing routing failures for Copilot-authenticated users

These aren't flashy features, but they close a class of security gaps where misconfigured or malicious endpoints could hijack provider routing.

## Notable Fixes

Beyond the headliners, v2026.4.2 bundles a significant list of fixes:

- **Gateway exec loopback** ([PR #59092](https://github.com/openclaw/openclaw/pull/59092)): Restores the legacy-role fallback for empty paired-device token maps so local exec and node clients stop failing with `pairing-required` errors after the 2026.3.31 gateway hardening. Also fixes subagent loopback scope-upgrade crashes ([PR #59555](https://github.com/openclaw/openclaw/pull/59555)).
- **Slack mrkdwn** ([PR #59100](https://github.com/openclaw/openclaw/pull/59100)): Adds built-in Slack mrkdwn guidance in inbound context so Slack replies no longer render as generic Markdown. A long-standing annoyance for Slack-first deployments.
- **WhatsApp presence** ([PR #59410](https://github.com/openclaw/openclaw/pull/59410)): Sends unavailable presence on connect in self-chat mode, preventing personal-phone users from losing all push notifications while the gateway runs.
- **Agents/compaction model** ([PR #56710](https://github.com/openclaw/openclaw/pull/56710)): `agents.defaults.compaction.model` now resolves consistently across all compaction paths — manual `/compact`, context-engine-triggered, and tool-policy-driven. Plus new `agents.defaults.compaction.notifyUser` makes the 🧹 start notice opt-in ([PR #54251](https://github.com/openclaw/openclaw/pull/54251)).

## How to Upgrade

Update to v2026.4.2 via your usual method (`npm install -g openclaw@latest` or however you manage the package). If you use xAI web search or Firecrawl, run `openclaw doctor --fix` immediately after upgrading to migrate your config. The full release notes are on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.4.2).
