---
title: "OpenClaw 2026.4.27: GPU Passthrough, Codex Computer Use, and Yuanbao"
excerpt: "OpenClaw 2026.4.27 ships opt-in Docker GPU passthrough for sandboxed agents, Codex Computer Use setup, a new Tencent Yuanbao channel, and a major Plugin SDK overhaul."
coverImage: '/assets/images/posts/openclaw-2026-4-29-release-2026-4-27.png'
date: '2026-04-29T23:00:00.000Z'
dateFormatted: April 29th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-29-release-2026-4-27.png'
---

OpenClaw dropped v2026.4.27 late Wednesday, and it's a dense one. The changelog spans GPU passthrough for Docker sandboxes, desktop control via Codex Computer Use, a brand-new Tencent Yuanbao channel, and a sweeping Plugin SDK refactoring that's been months in the making. Here's what's worth knowing.

## Docker GPU Passthrough for Sandboxed Agents

The headline feature for local AI workloads: `sandbox.docker.gpus` passthrough is now opt-in. If your host Docker runtime supports `--gpus`, sandboxed agent containers can now access it directly. This closes [#57976](https://github.com/openclaw/openclaw/issues/57976) and was contributed by [@cyan-ember](https://github.com/cyan-ember).

For anyone running local GPU-accelerated models inside sandboxed OpenClaw agents — think Ollama with a dedicated GPU, or custom CUDA workloads — this is a meaningful unlock. Previously, Docker sandbox containers were GPU-blind.

## Codex Computer Use Is Now First-Class

The `/codex computer-use` command gets a proper setup flow in this release: `status/install`, marketplace discovery, optional auto-install, and fail-closed MCP server checks before Codex-mode turns start. Fixes [#72094](https://github.com/openclaw/openclaw/issues/72094), contributed by [@pash-openai](https://github.com/pash-openai).

New documentation also clarifies how Codex Computer Use, direct `cua-driver` MCP, and OpenClaw.app's PeekabooBridge fit together — historically a source of confusion for users setting up desktop control pipelines.

## Tencent Yuanbao Channel Support

OpenClaw now officially registers the Tencent Yuanbao external channel plugin (`openclaw-plugin-yuanbao`) in the channel catalog. There's a new `docs/channels/yuanbao.md` quick-start guide for WebSocket bot DMs and group chats. The channel is contributed by [@loongfay](https://github.com/loongfay) and represents a significant expansion for Chinese-language deployments.

QQ Bot also got a major overhaul in this release — full group chat support including history tracking, `@`-mention gating, activation modes, per-group config, a FIFO message queue with deliver debounce, and C2C stream_messages streaming via a new `StreamingController` lifecycle manager. Contributed by [@cxyhhhhh](https://github.com/cxyhhhhh).

## Outbound Proxy Routing

Operators can now configure a managed outbound proxy (`proxy.enabled` + `proxy.proxyUrl` / `OPENCLAW_PROXY_URL`) with strict `http://` forward-proxy validation, loopback-only Gateway bypass, and proper cleanup on exit. Contributed by [@jesse-merhi](https://github.com/jesse-merhi) and [@joshavant](https://github.com/joshavant) via [#70044](https://github.com/openclaw/openclaw/pull/70044).

This is useful for enterprise deployments where all outbound traffic must route through a corporate proxy.

## Plugin SDK Overhaul

A significant chunk of this release is the Plugin SDK cleanup. Highlights:

- **Manifest-backed provider catalogs**: Qianfan, Xiaomi, NVIDIA, Cerebras, Mistral, Moonshot, DeepSeek, Tencent TokenHub, StepFun, BytePlus, Volcano Engine, Fireworks, and Together AI all move their model catalogs into plugin manifest `modelCatalog` rows. Core no longer carries bundled-provider routing tables.
- **Explicit startup activation**: Plugins now declare `activation.onStartup` in their manifests. The old implicit sidecar loading is deprecated with a compat warning and dated removal window.
- **Focused SDK test subpaths**: A dozen new focused test subpaths replace the old `test/helpers` bridges, so extension tests no longer need to import repo-internal paths.

## Other Notable Changes

- **iOS/Android presence events**: A new authenticated `node.presence.alive` protocol event lets background iOS and Android wakes mark paired nodes recently alive without treating them as connected.
- **Non-image attachments via chat.send**: Gateway now stages non-image files as agent-readable media paths rather than silently dropping them. Fixes [#48123](https://github.com/openclaw/openclaw/issues/48123).
- **DeepInfra provider**: A new bundled DeepInfra provider lands in this release.
- **Matrix streaming**: Tool-progress updates now stream into live Matrix preview edits by default.
- **Docker TLS fix**: The slim Docker runtime image now bundles the CA certificate bundle, fixing HTTPS failures on containerized gateways after the `bookworm-slim` base switch. Fixes [#72787](https://github.com/openclaw/openclaw/issues/72787).

Full changelog: [v2026.4.27 on GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.27).
