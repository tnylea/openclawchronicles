---
title: "OpenClaw beta.5 Adds Context Maps and Smarter Agent Chaining"
excerpt: "OpenClaw v2026.5.10-beta.5 lands with a visual context treemap command, configurable agent-to-agent turn limits, sandboxed message controls, and a wave of Discord voice improvements."
coverImage: '/assets/images/posts/openclaw-2026-5-12-beta5-context-maps-agent-chains.png'
date: '2026-05-12T08:00:00.000Z'
dateFormatted: May 12th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-12-beta5-context-maps-agent-chains.png'
---

OpenClaw shipped two pre-release builds on May 11th — beta.4 at 16:04 UTC and beta.5 at 16:38 UTC — with beta.5 superseding the earlier cut. The changelog is substantial: a new visual debugging command, configurable agent-to-agent chaining, per-agent sandbox controls, a batch of Discord voice upgrades, and several Slack quality-of-life fixes. Here is what is worth your attention.

## /context map — See What Is Eating Your Context Window

The headline addition in this cycle is `/context map`, a new slash command that generates and sends a treemap image of your current session's context contributors. ([#79867](https://github.com/openclaw/openclaw/pull/79867))

If you have ever wondered why a long session suddenly starts compacting, this command gives you a visual answer: each block in the treemap represents a source of token consumption — system prompt, tools, conversation history, skill instructions — sized by its relative footprint. It is the kind of introspection tool that shifts debugging from guesswork to evidence.

The companion fix ensures the map only renders from actual run context and excludes deferred tool-search schemas from the prompt-loaded tool count, so the numbers reflect reality.

## Agent-to-Agent Chains Can Now Run Longer

`session.agentToAgent.maxPingPongTurns` was previously capped at 5 and not configurable. Beta.5 raises the ceiling to 20 while keeping the default at 5. ([#52400](https://github.com/openclaw/openclaw/pull/52400), fixes [#52382](https://github.com/openclaw/openclaw/issues/52382))

For workflows where one agent consults another iteratively — research loops, multi-step code review, or orchestration patterns with a planner and executor — this unlocks meaningful depth without having to restructure the flow entirely. Operators who want tighter budgets can still set it explicitly to whatever limit fits their use case.

## Sandboxed Agent Message Controls

Two new per-agent config keys give operators fine-grained control over what sandboxed or public-facing agents are allowed to send:

- **`tools.message.crossContext`** — restricts message sends to the current conversation only, without touching the global bot policy.
- **`tools.message.actions.allow`** — exposes and enforces send-only message tools for agents that should be able to reply but not initiate arbitrary channel messages.

These are especially relevant if you are running public Discord bots or shared agents where you want to prevent a compromised or misbehaving agent from reaching outside its conversation scope.

## Discord Voice Gets a Significant Upgrade

Three voice-related changes land together in this release:

**`voice.allowedChannels`** lets operators restrict which voice channels a bot can join or be moved into. When unset, behavior stays open as before — but for public servers, this is the configuration you have been waiting for.

**Pure-JS opus decoder by default.** Test and source installs now default to `opusscript` (pure JavaScript) instead of the native `@discordjs/opus` addon. This eliminates slow native addon compilation times for the majority of setups. If you are running a performance-sensitive production voice bot, an opt-in native install script is available.

**Realtime voice diagnostics.** New diagnostic logging covers speaker turns, playback resets, barge-in detection, and audio cutoff analysis. Debugging voice quality issues just became a lot less painful.

Additionally, `talk.realtime.instructions` is now available ([#79081](https://github.com/openclaw/openclaw/pull/79081)), letting operators append custom voice style instructions to realtime sessions while preserving OpenClaw's built-in agent-consult guidance. Credit to [@VACInc](https://github.com/VACInc).

## Slack Quality-of-Life Fixes

Slack operators get a cluster of improvements:

- **Unfurl control:** `unfurlLinks` and `unfurlMedia` config options (including per-account overrides) let you suppress link and media previews in bot replies without touching workspace-wide settings. Fixes [#48435](https://github.com/openclaw/openclaw/issues/48435).
- **replyBroadcast:** Explicit support for `reply_broadcast` so thread replies can also appear in the parent channel. ([#64365](https://github.com/openclaw/openclaw/pull/64365))
- **DM routing fix:** Native DM channel IDs (`D...` targets) are now canonicalized to the peer user session, preventing a single Slack DM from splitting across two sessions. Fixes [#80091](https://github.com/openclaw/openclaw/issues/80091).
- **Mention metadata:** Inbound prompts now carry mention target/source metadata so agents can distinguish a direct bot mention from a thread wake-up that mentions someone else. Fixes [#79025](https://github.com/openclaw/openclaw/issues/79025).

## Private Skill Archive Uploads

A new opt-in gateway configuration key — `skills.install.allowUploadedArchives` — enables trusted Gateway clients to stage and install zip-backed skills directly. ([#74430](https://github.com/openclaw/openclaw/pull/74430), thanks [@samzong](https://github.com/samzong))

This is off by default, keeping the public skill install surface locked. Operators who explicitly enable it gain a way to ship custom or proprietary skills without publishing them to ClawHub.

## Plugin SDK: Image-First Structured Extraction

`extractStructuredWithModel()` is now available in the Plugin SDK, along with an optional provider-side `extractStructured()` seam. The API lets trusted plugins run bounded image-first structured extraction with optional supplemental text context through provider-owned runtimes like Codex. It is the building block for plugins that need to extract typed data from screenshots, documents, or live camera frames.

## Other Notable Changes

- **pnpm 11 upgrade** across the workspace — build, Docker, install, and release workflows all updated. ([#79414](https://github.com/openclaw/openclaw/pull/79414))
- **GPT Image 2 and Nano Banana 2 edit routing** through fal now correctly hits `/edit` with `image_urls` array, enforces NB2 geometry via `aspect_ratio` and `resolution` params, and lifts input-image caps to 10 (GPT Image 2) and 14 (NB2). ([#77295](https://github.com/openclaw/openclaw/issues/77295))
- **Control UI recovery panel:** Blank dashboard pages now show a plain HTML recovery panel with a retry path and browser-extension troubleshooting link when the app module fails to register. Fixes [#44107](https://github.com/openclaw/openclaw/issues/44107).
- **Fly.io container detection:** The gateway now correctly identifies Fly Machines from runtime env vars, so gateway bind and Bonjour defaults match remote container deployments. ([#80209](https://github.com/openclaw/openclaw/pull/80209))

Beta.5 is available now via `openclaw update`. The full release notes for [beta.5](https://github.com/openclaw/openclaw/releases/tag/v2026.5.10-beta.5) are on GitHub.
