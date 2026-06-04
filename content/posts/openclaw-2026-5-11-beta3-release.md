---
title: "OpenClaw v2026.5.10-beta.3: Slack Overhaul, Codex Native Mode, Plugin SDK Cleanup"
excerpt: "OpenClaw v2026.5.10-beta.3 ships with major Slack improvements, Codex native code-mode for harness threads, Plugin SDK deprecation cleanup, and on-demand local model startup."
coverImage: '/assets/images/posts/openclaw-2026-5-11-beta3-release.webp'
date: '2026-05-11T08:00:00.000Z'
dateFormatted: May 11th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-11-beta3-release.webp'
---

OpenClaw shipped `v2026.5.10-beta.3` early this morning (3:28 AM UTC, May 11th), and it's a substantial pre-release. Building on beta.1 and beta.2, this drop brings sweeping Slack improvements, a significant Codex architecture change, a major Plugin SDK deprecation sweep, and smarter on-demand local model infrastructure.

## Slack Gets Serious Attention

Five distinct Slack improvements land in beta.3, addressing long-standing issues:

- **Unfurl control**: New `unfurlLinks` and `unfurlMedia` config options — with per-account overrides — let bots suppress Slack link and media previews without workspace-wide changes. Fixes [#48435](https://github.com/openclaw/openclaw/issues/48435). Thanks [@esegev1](https://github.com/esegev1) and [@HemantSudarshan](https://github.com/HemantSudarshan).
- **replyBroadcast**: Agents can now opt into Slack's `reply_broadcast` behavior for both text and Block Kit thread replies, surfacing important responses in the parent channel. Thanks [@tony88331](https://github.com/tony88331).
- **Mention metadata preserved**: Inbound prompt context now carries mention target/source metadata, letting agents distinguish direct bot mentions from thread wakes that mention someone else. Fixes [#79025](https://github.com/openclaw/openclaw/issues/79025). Thanks [@tmimmanuel](https://github.com/tmimmanuel).
- **DM session canonicalization**: Delivery-mirror routes for native DM channel IDs now map correctly to the peer user session, so `D...`-style targets no longer accidentally split a Slack DM into a separate channel session. Fixes [#80091](https://github.com/openclaw/openclaw/issues/80091). Thanks [@bek91](https://github.com/bek91).
- **Draft preview identity**: Configured agent username and avatar now persist through partial streaming replies, so draft previews no longer flash the wrong bot identity mid-response. Fixes [#38235](https://github.com/openclaw/openclaw/issues/38235). Thanks [@lacymorrow](https://github.com/lacymorrow).

## Codex Native Code-Mode for Harness Threads

The configurable Codex dynamic-tools profile has been removed. Going forward, Codex app-server **always owns** the workspace, edit, patch, exec, process, and plan tools in harness threads — while OpenClaw integration tools remain available alongside them.

The practical effect: deferred OpenClaw dynamic tools now run through Codex's own searchable code execution surface instead of a wrapper. The change also resolves a diagnostics gap — Codex-native tool execution is now reported to the watchdog, so long-running bash, web, file, and MCP tool calls no longer look like stale embedded runs. See [#80217](https://github.com/openclaw/openclaw/pull/80217).

## Plugin SDK: Major Deprecation Sweep

The Plugin SDK receives a significant cleanup pass with beta.3:

- Public subpaths that existed for at least a month with no bundled extension production imports are now deprecated, while legacy barrel/test/zod exports remain for backwards compatibility
- Provider-specific model, stream, and xAI helpers removed from public exports, with callers moved to provider-owned modules
- The `provider-auth-login` owner-specific subpath removed after Chutes, GitHub Copilot, and OpenAI Codex auth flows returned to provider-owned modules

New additions include:

- **Runtime model metadata for plugins**: Native plugin tool factories now receive runtime-supplied active model metadata, enabling diagnostics and plugin-owned policy decisions. Fixes [#77857](https://github.com/openclaw/openclaw/issues/77857). Thanks [@jamiezigelbaum](https://github.com/jamiezigelbaum).
- **Session actions and scheduling**: Bundled-plugin session actions, `sendSessionAttachment`, and Cron-backed `scheduleSessionTurn` added under the grouped session namespace. Thanks [@100yenadmin](https://github.com/100yenadmin).
- **Structured extraction**: `extractStructuredWithModel()` plus an optional provider-side `extractStructured()` seam for bounded image-first structured extraction with supplemental text context.

## On-Demand Local Model Startup

A new provider-level `localService` startup capability allows on-demand local model servers to spin up before OpenAI-compatible requests are made, including one-shot model probes. This targets setups where local inference servers should start lazily on first use rather than running continuously in the background.

## Tighter Build Tooling

The build stack gets several improvements:

- **pnpm 11** is now the workspace package manager, with Docker, install, update, and release CI workflows updated accordingly. Thanks [@altaywtf](https://github.com/altaywtf).
- **Stricter TypeScript checks** enabled: implicit returns, side-effect imports, override keyword, and unused production code detection
- **Stricter Vitest lint rules** for focused/disabled tests, conditional hooks, matcher hazards, and expectation integrity

## Notable Bug Fixes

- **Auth/Claude CLI**: Stale `anthropic:claude-cli` OAuth profiles no longer repeatedly bootstrap on startup and flood debug logs. Fixes [#80129](https://github.com/openclaw/openclaw/issues/80129). Thanks [@Caulderein](https://github.com/Caulderein).
- **Task routing**: Group and channel task completions now route through the requester session so the parent agent delivers the visible summary. Fixes [#77251](https://github.com/openclaw/openclaw/issues/77251). Thanks [@funmerlin](https://github.com/funmerlin).
- **Image tool overrides**: Explicit `--model` flags for the image tool now work even when `agents.defaults.imageModel` is unset. Fixes [#79341](https://github.com/openclaw/openclaw/issues/79341). Thanks [@haumanto](https://github.com/haumanto).
- **Feishu**: Falls back to top-level group send when quoted replies target a withdrawn or missing message. Fixes [#79349](https://github.com/openclaw/openclaw/issues/79349). Thanks [@arlen8411](https://github.com/arlen8411).
- **Gateway/agents**: Stale `sessions_send` ACP manager and `web_fetch` runtime chunks stay importable after package updates, preventing live gateways from breaking before restart. Fixes [#78804](https://github.com/openclaw/openclaw/issues/78804). Thanks [@Gomesy72](https://github.com/Gomesy72).

The full release notes are on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.10-beta.3).
