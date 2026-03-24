---
title: 'OpenClaw 2026.3.22 Released: The Plugin Overhaul You Didn't Know Was Coming'
excerpt: 'The March 22nd release is one of the most sweeping updates in recent memory — a full plugin SDK migration, ClawHub-first installs, new web search integrations, and a wave of breaking changes that demand your attention before you update.'
coverImage: '/assets/images/posts/release-breakdown.png'
date: '2026-03-22T11:11:00.000Z'
dateFormatted: March 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/release-breakdown.png'
---

OpenClaw's March 22nd release landed quietly but hits hard. Version `2026.3.22` is one of the most substantive updates in recent memory — a near-complete restructuring of how plugins, skills, and the extension API work, alongside a flood of new features, security fixes, and UI polish. If you're running a self-hosted instance, you'll want to read this before blindly running `openclaw update`.

## The Big Shift: A Public Plugin SDK

The most significant architectural change in this release is the retirement of `openclaw/extension-api` in favor of a new, narrower public surface: `openclaw/plugin-sdk/*`.

There is **no compatibility shim**. If your bundled plugins import from the old SDK root, they will break.

The new model requires plugins to use **injected runtime** for host-side operations (e.g., `api.runtime.agent.runEmbeddedPiAgent`) and restricts direct imports to specific `openclaw/plugin-sdk/*` subpaths. The OpenClaw team has published a full [migration guide](https://docs.openclaw.ai/plugins/sdk-migration) and an [SDK overview](https://docs.openclaw.ai/plugins/sdk-overview) to help you make the transition.

## ClawHub Is Now the Default for Plugin Installs

Previously, `openclaw plugins install <name>` would go straight to npm. Starting with this release, **ClawHub gets priority** for any npm-safe package name — npm is only consulted if ClawHub doesn't have it.

This is a meaningful shift for the ecosystem. It positions ClawHub as the canonical skill and plugin marketplace, and means the community can expect faster, more curated install experiences for popular packages. See the updated [ClawHub docs](https://docs.openclaw.ai/tools/clawhub) for details.

## New Web Search Integrations

Three new bundled web search providers ship in this release:

- **Exa** — Exa-native date filters, search-mode selection, and optional content extraction via `plugins.entries.exa.config.webSearch.*`
- **Tavily** — Dedicated `tavily_search` and `tavily_extract` tools under `plugins.entries.tavily.config.webSearch.*`
- **Firecrawl** — Exposes `firecrawl_search` and `firecrawl_scrape` tools with core `web_fetch` fallback behavior

These join the existing search tooling as first-class options you can configure per-agent. Useful if you want specialized crawling or extraction beyond the defaults.

## New `/btw` Command

One of the more delightful quality-of-life additions: `/btw` lets you ask side questions in the current session without polluting the agent's context. You get a dismissible in-session answer in the TUI or an explicit BTW reply in external channels like Slack or Telegram — and the conversation continues as if you never asked. Great for quick clarifications without derailing your workflow.

## Other Notable Changes

- **OpenAI default model updated** to `openai/gpt-5.4` for setup, with `gpt-5.4-mini` and `gpt-5.4-nano` now supported natively
- **Per-agent thinking/reasoning defaults** — configure reasoning depth at the agent level rather than globally
- **Claude via Google Vertex AI** — Anthropic Vertex provider support added for teams running on GCP
- **Chutes provider** bundled in with OAuth/API-key auth and dynamic model discovery
- **Matrix plugin rebuilt** from scratch using the official `matrix-js-sdk` — upgrade path has a [migration guide](https://docs.openclaw.ai/install/migrating-matrix)
- **Sandbox backends now pluggable** — OpenShell and SSH backends ship out of the box, with Docker no longer assumed
- **Control UI roundness slider** — Appearance settings now let you dial in corner radius from sharp to fully rounded

## Breaking Changes Checklist

Before you update, make sure you've addressed:

- Migrate plugin imports from `openclaw/extension-api` → `openclaw/plugin-sdk/*`
- Update message discovery adapters to use `describeMessageTool(...)` (legacy `listActions` / `getCapabilities` removed)
- Run `openclaw doctor --fix` to migrate Chrome browser config away from the removed extension relay path
- Replace `CLAWDBOT_*` / `MOLTBOT_*` env variables with `OPENCLAW_*` equivalents
- Move any state still under `~/.moltbot` to `~/.openclaw`
- Replace the `nano-banana-pro` skill config with `agents.defaults.imageGenerationModel`

This is a big release with real migration work attached. The upside: once you're through the breaking changes, the plugin architecture is significantly cleaner going forward.

---

*Source: [OpenClaw v2026.3.22 Release Notes](https://github.com/openclaw/openclaw/releases/tag/v2026.3.22)*
