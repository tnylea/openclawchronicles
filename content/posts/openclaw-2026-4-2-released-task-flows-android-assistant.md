---
title: "OpenClaw 2026.4.2 Released: Task Flows and Android Assistant"
excerpt: "OpenClaw 2026.4.2 lands with restored Task Flow substrate, Android Google Assistant App Actions, and breaking plugin config migrations for xAI and Firecrawl."
coverImage: '/assets/images/posts/openclaw-2026-4-2-released-task-flows-android-assistant.png'
date: '2026-04-02T23:00:00.000Z'
dateFormatted: April 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-2-released-task-flows-android-assistant.png'
---

OpenClaw pushed version **2026.4.2** today — a substantial release that restores the long-awaited Task Flow substrate, adds Google Assistant App Actions for Android, ships two breaking plugin config migrations, and delivers a broad sweep of provider transport hardening.

## Breaking Changes First

Two breaking changes land in this release, both managed via `openclaw doctor --fix`:

**xAI plugin config path migration.** The `x_search` settings move from the legacy core path `tools.web.x_search.*` to the plugin-owned `plugins.entries.xai.config.xSearch.*` namespace. Authentication now standardizes on `plugins.entries.xai.config.webSearch.apiKey` (or the `XAI_API_KEY` env var). Run `openclaw doctor --fix` to auto-migrate. ([#59674](https://github.com/openclaw/openclaw/pull/59674))

**Firecrawl web_fetch config migration.** Similarly, the Firecrawl web fetch config moves from `tools.web.fetch.firecrawl.*` to `plugins.entries.firecrawl.config.webFetch.*`, and the fallback routing now goes through the proper fetch-provider boundary rather than a legacy Firecrawl-only core branch. Again: `openclaw doctor --fix` handles it. ([#59465](https://github.com/openclaw/openclaw/pull/59465))

Both migrations were authored by [@vincentkoc](https://github.com/vincentkoc) as part of the ongoing push to move plugin-owned configuration off shared core paths.

## Task Flow Substrate Restored

The headline feature of 2026.4.2 is the restoration of the **core Task Flow substrate**, which had been partially disabled in prior releases:

- **Managed vs. mirrored sync modes** — flows can now declare whether they manage their own state or mirror an external source
- **Durable flow state and revision tracking** — flow state persists across restarts, with full revision history
- **`openclaw flows` inspection and recovery** — new CLI primitives for viewing flow status and recovering stuck flows ([#58930](https://github.com/openclaw/openclaw/pull/58930))

On top of that, **managed child task spawning** now includes sticky cancel intent: an external orchestrator can stop scheduling immediately, and the parent Task Flow will settle to cancelled once active child tasks finish naturally. ([#59610](https://github.com/openclaw/openclaw/pull/59610))

Plugins and trusted authoring layers also gain a `api.runtime.taskFlow` seam — a bound API surface for creating and driving managed Task Flows without passing owner identifiers on every call. ([#59622](https://github.com/openclaw/openclaw/pull/59622))

All three changes come from [@mbelinky](https://github.com/mbelinky).

## Android Meets Google Assistant

The Android app gains **assistant-role entrypoints plus Google Assistant App Actions metadata**, which means Android can now launch OpenClaw from the assistant trigger — hold the home button or say "Hey Google, ask OpenClaw…" — and hand the prompt directly into the chat composer. ([#59596](https://github.com/openclaw/openclaw/pull/59596), thanks [@obviyus](https://github.com/obviyus))

No gateway config required; the Android app handles the intent and forwards it as a standard chat message.

## Provider Transport Hardening

[@vincentkoc](https://github.com/vincentkoc) landed a significant batch of transport security fixes:

- **Centralized request auth, proxy, TLS, and header shaping** across shared HTTP, stream, and websocket paths — insecure TLS/runtime transport overrides are now blocked ([#59682](https://github.com/openclaw/openclaw/pull/59682))
- **GitHub Copilot base URL routing** centralized in the shared provider endpoint resolver, with hardened token-derived proxy endpoint parsing ([#59644](https://github.com/openclaw/openclaw/pull/59644))
- **Anthropic native-vs-proxy classification** centralized so spoofed or proxied hosts no longer inherit native Anthropic defaults ([#59608](https://github.com/openclaw/openclaw/pull/59608))
- **Image generation providers** (OpenAI, MiniMax, fal) now route through the shared provider HTTP transport — custom base URLs and private-network routing stay aligned; hostile endpoints fail closed ([vincentkoc](https://github.com/vincentkoc))

## Notable Channel Updates

- **Matrix** now emits spec-compliant `m.mentions` metadata across all send paths so mentions notify reliably in Element and other Matrix clients ([#59323](https://github.com/openclaw/openclaw/pull/59323))
- **Feishu Drive** gains a dedicated Drive comment-event flow with in-thread replies and `feishu_drive` comment actions ([#58497](https://github.com/openclaw/openclaw/pull/58497))
- **Exec defaults** on gateway/node host now default to YOLO mode (`security=full`, `ask=off`), aligning local exec behavior with documented expectations
- **Agents compaction** gets a new `agents.defaults.compaction.notifyUser` toggle so the "🧹 Compacting context..." notice is opt-in ([#54251](https://github.com/openclaw/openclaw/pull/54251))
- **Gateway/exec loopback** regression fixed — empty paired-device token maps no longer cause pairing-required failures after the 2026.3.31 release ([#59092](https://github.com/openclaw/openclaw/pull/59092))
- **Subagents** — `sessions_spawn` no longer dies with `close(1008) "pairing required"` on loopback scope-upgrade due to a privilege fix for admin-only gateway calls ([#59555](https://github.com/openclaw/openclaw/pull/59555))

## Upgrade

```bash
npm update -g openclaw
# Then run:
openclaw doctor --fix
```

The `--fix` flag handles both the xAI and Firecrawl config migrations automatically. Full changelog on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.2).
