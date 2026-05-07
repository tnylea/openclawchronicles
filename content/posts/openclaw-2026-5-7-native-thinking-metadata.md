---
title: "OpenClaw Native App Gets Metadata-Aware Thinking Controls"
excerpt: "PR #78841 lands on main: OpenClaw's iOS and macOS apps now render thinking-level pickers from live gateway metadata instead of hard-coded defaults."
coverImage: '/assets/images/posts/openclaw-2026-5-7-native-thinking-metadata.png'
date: '2026-05-07T08:00:00.000Z'
dateFormatted: May 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-7-native-thinking-metadata.png'
---

A small but meaningful merge landed on OpenClaw's main branch this morning: [PR #78841](https://github.com/openclaw/openclaw/pull/78841) by BunsDev rewires how the thinking-level picker works in the iOS and macOS native apps. Instead of presenting hard-coded reasoning options, the picker now decodes live metadata from the gateway and renders only the thinking levels your current model actually supports.

## What Changed

Before this PR, the native thinking picker was backed by a fixed set of base levels baked into the app. That worked fine for the original model lineup, but as OpenClaw gained support for a growing roster of providers — each with its own thinking vocabulary — the static list became a liability. Users on models that didn't support certain modes could select options that silently failed or produced unexpected results.

PR #78841 fixes that cleanly:

- **Metadata decoding** — The native `OpenClawKit` shared library now decodes gateway-provided `thinkingLevels` metadata from the active session and default model config.
- **Dynamic picker rendering** — The iOS and macOS thinking picker reads from that decoded metadata rather than a hard-coded array, so it only shows options the connected model actually understands.
- **Legacy value preservation** — Existing thinking values like `adaptive`, `xhigh`, and `max` are carried forward without leaking default-model options into a different active session model. If you've set a custom thinking level, it stays set.

The PR includes Swift test coverage via `swift test --filter ChatViewModelTests` and `WebChatSwiftUISmokeTests`, plus a `pnpm lint:swift` pass.

## Why It Matters

OpenClaw's native apps have historically lagged slightly behind the CLI and Control UI when it comes to surfacing new model capabilities. The thinking picker is one of the most visible controls for power users — it determines how much reasoning budget the model applies before it responds, which directly affects quality on complex tasks.

Making the picker data-driven rather than static means future model additions automatically surface the right options in-app without requiring an app update. It's the kind of infrastructure improvement that pays dividends quietly every time a new provider or model lands.

## Also Merged Today

A second PR closed on main this morning: [#77880](https://github.com/openclaw/openclaw/pull/77880) ("retire stale direct DM rows after dmScope changes") by BunsDev. This is a cleanup fix that removes lingering DM session rows in the Control UI when a channel's `dmScope` setting changes — a subtle staleness issue that could leave the sessions table showing outdated entries for channels that had their DM handling reconfigured.

Neither PR is release-tagged yet. Both are queued for the upcoming **v2026.5.7** patch, which is taking shape on main.

## What to Watch

If you run OpenClaw off the `main` branch or track pre-releases, these changes are live now. For everyone else, keep an eye on the [releases page](https://github.com/openclaw/openclaw/releases) for v2026.5.7 — it's looking like a solid quality-of-life patch.

The full PR details for the thinking metadata work are at [github.com/openclaw/openclaw/pull/78841](https://github.com/openclaw/openclaw/pull/78841).
