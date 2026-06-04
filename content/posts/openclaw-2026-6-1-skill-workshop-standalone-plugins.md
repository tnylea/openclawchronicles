---
title: "OpenClaw v2026.6.1: Skill Workshop, Standalone Plugins, and a Smarter Core"
excerpt: "OpenClaw v2026.6.1-beta.2 lands with a governed Skill Workshop, externalized Tokenjuice and Copilot plugins, Workboard multi-agent orchestration, and MiniMax M3 support."
coverImage: '/assets/images/posts/openclaw-2026-6-1-skill-workshop-standalone-plugins.webp'
date: '2026-06-01T23:00:00.000Z'
dateFormatted: June 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-1-skill-workshop-standalone-plugins.webp'
---

OpenClaw dropped **v2026.6.1-beta.2** tonight — and it's one of the more feature-dense releases in recent memory. Alongside the usual wave of reliability fixes, this build ships a brand-new **Skill Workshop**, two officially externalized plugins, a new **Workboard** orchestration layer, iPad support, and MiniMax M3 model coverage. Here's what's actually in it.

## Skill Workshop: Governed Skill Creation Is Here

The headliner is Skill Workshop — a new end-to-end system for creating, reviewing, and deploying skills with full governance baked in. Instead of dropping skill files into your workspace and hoping for the best, Skill Workshop introduces a **proposal → review → approve/reject/quarantine** flow.

Key pieces of the workflow:

- **Proposals** can be submitted with versioned frontmatter and revised in place before approval
- The `skill_workshop` agent tool lets the agent itself apply, reject, or quarantine proposals through the guarded review flow
- Approved proposals can carry support files (scripts, references, assets) with scanner, hash, and rollback safeguards
- A full **Control UI tab** ships with it: proposal lists, a today view, revision dialog, searchable file previews, and reusable session handoff

The docs team also landed a dedicated [Skill Workshop guide](https://github.com/openclaw/openclaw/pull/88734) covering the full lifecycle — from governed creation through CLI/Gateway review actions, approval policy, and recovery paths. Thanks to [@shakkernerd](https://github.com/shakkernerd) and [@vyctorbrzezowski](https://github.com/vyctorbrzezowski) for driving this.

## Tokenjuice and Copilot Are Now First-Party Plugins

Two previously bundled components are now standalone packages:

- **`@openclaw/tokenjuice`** — the token optimization layer, now published to npm and ClawHub
- **`@openclaw/copilot`** — the GitHub Copilot agent runtime, now an independent plugin with its own publish metadata

This is architecturally significant. Both plugins follow the new **SecretRef provider integration manifest** contract introduced this release ([#82326](https://github.com/openclaw/openclaw/pull/82326)), which gives plugin authors a cleaner path to handle credentials without storing them in the config directly. Expect more plugins to follow this pattern.

The plugin install ledger also moved to **SQLite** ([#88794](https://github.com/openclaw/openclaw/pull/88794)), which means installed package lookups survive reloads without hammering the filesystem.

## Workboard: Multi-Agent Orchestration Primitives

The **Workboard** feature landed orchestration primitives for coordinating multiple agents across planning and execution runs ([#87469](https://github.com/openclaw/openclaw/pull/87469)). Task-backed board runs are now wired up, and task comments show up in the edit modal. If you're running OpenClaw as infrastructure for multi-agent workflows, this is the foundation the team is building on.

## MiniMax M3 and Provider Updates

The provider roster grew this release. **MiniMax M3** is now fully supported ([#88860](https://github.com/openclaw/openclaw/pull/88860)), and a round of catalog fixes landed for Google/Vertex and OpenRouter (SQLite model caching). Copilot's Claude 1M capability is now correctly preserved, Foundry reasoning metadata got aligned, and the team squashed a bug that caused OpenAI Responses replay IDs to appear when the store was disabled ([#88480](https://github.com/openclaw/openclaw/issues/88480)).

## iOS Gets iPad Layouts and Reliable Push

Two iOS improvements worth noting:

- **Native iPad display layouts** — OpenClaw finally renders correctly on larger screens
- **Hosted push relay defaults** + realtime Talk playback, with a guarded WebSocket ping path for steadier mobile sessions

The iMessage monitor state also migrated to **SQLite-backed tracking** ([#88797](https://github.com/openclaw/openclaw/pull/88797)), which should make iMessage-connected agents more reliable across restarts.

## Channel and Memory Stability

Channels across Telegram, WhatsApp, iMessage, Slack, Discord, Teams, and Google Chat got steadier request/retry timer handling. Inbound queues are now SQLite-backed. The memory subsystem saw a meaningful patch batch: serialized QMD writes per store, Linux watcher fan-out reduction, transient FileProvider retry logic, and transcript path rewrites on rollover ([#89185](https://github.com/openclaw/openclaw/pull/89185), [#85351](https://github.com/openclaw/openclaw/pull/85351)). Thanks to [@RomneyDa](https://github.com/RomneyDa) and [@NianJiuZst](https://github.com/NianJiuZst) for the hot-path work.

## Other Highlights

- **Doctor** now checks disk space and stabilizes post-upgrade JSON probes
- **CLI**: `openclaw agents add` no longer requires provider catalog availability ([#88314](https://github.com/openclaw/openclaw/pull/88314)) — a long-standing friction point
- **WSL clipboard** bridging through the shell ([#88764](https://github.com/openclaw/openclaw/pull/88764))
- **Dreaming tab** in the Control UI now has an agent selector ([#78748](https://github.com/openclaw/openclaw/pull/78748))
- **Code mode** adds internal namespaces for scoped sessions and MCP API files

## Full Changelog

The complete diff is on GitHub: [v2026.6.1-beta.2 release notes](https://github.com/openclaw/openclaw/releases/tag/v2026.6.1-beta.2).
