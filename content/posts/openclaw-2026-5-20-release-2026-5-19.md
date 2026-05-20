---
title: "OpenClaw 2026.5.19: Android Voice Goes Real-Time, Plugin SDK Lands"
excerpt: "OpenClaw 2026.5.19 ships realtime Android Talk Mode, a typed plugin build SDK, Mac Settings redesign, and a critical memory search performance fix."
coverImage: '/assets/images/posts/openclaw-2026-5-20-release-2026-5-19.png'
date: '2026-05-20T23:00:00.000Z'
dateFormatted: May 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-20-release-2026-5-19.png'
---

OpenClaw 2026.5.19 landed today as a stable release, and it's one of the heavier drops in recent memory. Across Android, the Mac app, the plugin SDK, browser automation, Telegram, and the Gateway, this release ships real substance — not just patches.

## Android Talk Mode Goes Full Real-Time

The headline change is on Android. Talk Mode has been completely reengineered to run as a **realtime Gateway relay voice session** — streaming mic input, realtime audio playback, tool-result bridging, and live on-screen transcripts, all working together. This is a ground-up rebuild of how Android handles voice interaction. If you've been frustrated by lag or transcript gaps in Talk Mode, 2026.5.19 is the upgrade to grab.

## Plugin SDK: Build Your Own Tools

A significant win for developers: `defineToolPlugin` is now part of the plugin SDK, joined by three new CLI commands:

- `openclaw plugins build` — compile your plugin to a distributable form
- `openclaw plugins validate` — check manifest contracts and tool declarations
- `openclaw plugins init` — scaffold a new typed plugin from a template

These ship with typed simple tool plugin support, generated manifest metadata, optional tool declarations, and context factories. A new `--global` flag on `openclaw skills install` and `openclaw skills update` also makes managing shared managed skills environments straightforward.

## Mac App: Settings Gets a Real Redesign

The macOS Settings pages have been rebuilt with **consistent card layouts**, cached navigation, and cleaner panes for permissions, voice, skills, cron, exec, and debug. Voice & Talk settings now use the same compact card row style as the rest of Settings — the visual inconsistency between sections is gone. It's a long-overdue polish pass that makes the Mac app feel cohesive.

## Browser Automation: Dialog Handling

The browser tool now surfaces **pending and recently handled modal dialogs** in snapshots, returns a `blockedByDialog` signal when an action opens a modal, and supports `browser dialog --dialog-id` to answer dialogs programmatically. A new `--timeout-ms` flag on `openclaw browser evaluate` lets long-running page functions extend both evaluate action and request timeout budgets ([#83447](https://github.com/openclaw/openclaw/pull/83447)). If you automate sites that throw modals — login prompts, cookie banners, confirmation dialogs — this is a meaningful upgrade.

## Memory Search: Critical Performance Fix

A long-standing threading issue has been resolved. The JS-side fallback vector path — used when the sqlite-vec index is unavailable or has mismatched dimensions — was scanning in a single giant batch, pinning the Node.js main thread for multi-second windows on large chunk tables. It now scans in **bounded rowid batches** and yields to the event loop between each batch. The SQL prepared statement is also properly rooted to prevent finalization under heap pressure. This fixes [#81172](https://github.com/openclaw/openclaw/issues/81172) and removes a real freeze risk for users with large memory stores.

## Gateway Startup Latency Improvement

The Gateway now overlaps startup logging and plugin-service startup with channel sidecars, **cutting restart ready latency** while preserving `/readyz` sidecar gating. Startup probe, config, runtime, and resource-count costs are now attributed in restart traces — easier diagnosis without changing readiness behavior. Restart benchmarking tooling (`pnpm test:restart:gateway`) has also been added for measuring readiness, downtime, and resource slope in repeatable runs.

## New Skills: Meme Maker and Python Debugging

Two new built-in skills ship in this release:

- **meme-maker** — curated template search, local SVG/PNG rendering, Imgflip hosted rendering, and Know Your Meme provenance links
- **Python debugging** — pdb, `breakpoint()`, post-mortem inspection, and debugpy remote attach workflows

The Obsidian skill has also been updated to target the official `obsidian` CLI rather than the deprecated third-party `obsidian-cli`. If you use Obsidian with OpenClaw, update your skill setup.

## Telegram: Forum Topic Reliability

Two important Telegram fixes land here. First, forum topics no longer block sibling topic traffic — inbound serialization, media buffers, and account API queues are now routed on topic-aware lanes ([#83829](https://github.com/openclaw/openclaw/pull/83829)). Second, queued forum-topic follow-up messages no longer inherit superseded source abort signals, so later turns in the same topic can still run and reply after an active turn is replaced ([#83827](https://github.com/openclaw/openclaw/pull/83827)). For heavy Telegram users, these are real reliability wins.

## Codex Plugin Management from Chat

`/codex plugins list`, `enable`, and `disable` are now available directly in chat, letting you manage configured native Codex plugins without touching config files by hand. Config lookup also now exposes reload metadata so tools can distinguish restart-required, hot-reloadable, and no-op fields before applying edits — avoiding unnecessary restarts.

## Other Notable Changes

- **HTTPS proxy**: Managed forward-proxy endpoints with scoped `proxy.tls.caFile` CA trust are now supported ([#79171](https://github.com/openclaw/openclaw/pull/79171))
- **Telegram DM draft previews**: Allowlisted native DM draft previews for transient tool progress, keeping final answers on the normal persistent delivery path ([#83622](https://github.com/openclaw/openclaw/pull/83622))
- **CLI port validation**: Port numbers above 65535 are now rejected before reaching Gateway or Node bind paths ([#84008](https://github.com/openclaw/openclaw/pull/84008))
- **Anthropic/Claude 4**: Image capability is now preserved when a configured model ref resolves through a stale local catalog row — fixes the `text-only` misclassification that's been catching users off guard

## Upgrade

```bash
openclaw update
```

Full changelog: [github.com/openclaw/openclaw/releases/tag/v2026.5.19](https://github.com/openclaw/openclaw/releases/tag/v2026.5.19)
