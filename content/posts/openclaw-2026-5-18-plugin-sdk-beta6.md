---
title: "OpenClaw beta.6 Ships a Type-Safe Plugin SDK"
excerpt: "OpenClaw v2026.5.16-beta.6 introduces defineToolPlugin with build, validate, and init commands, making typed simple tool plugins a first-class citizen."
coverImage: '/assets/images/posts/openclaw-2026-5-18-plugin-sdk-beta6.webp'
date: '2026-05-18T08:05:00.000Z'
dateFormatted: May 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-18-plugin-sdk-beta6.webp'
---

OpenClaw dropped [v2026.5.16-beta.6](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.6) in the early hours of May 18th, and the headline feature is one developers have been asking for: a proper plugin authoring SDK. This release also ships browser modal surfacing, HTTPS proxy support, and a batch of meaningful fixes across Feishu, Telegram, memory, and the Gateway restart path.

## defineToolPlugin: Typed Simple Tool Plugins Are Now First-Class

The biggest addition in beta.6 is `defineToolPlugin`, a new function that gives plugin authors a typed, structured way to declare simple tool plugins — complete with generated manifest metadata, optional tool declarations, and context factories.

Alongside `defineToolPlugin`, three new CLI subcommands land:

- **`openclaw plugins build`** — compiles a plugin and produces a distributable bundle
- **`openclaw plugins validate`** — lints a plugin against the manifest contract before you publish
- **`openclaw plugins init`** — scaffolds a new plugin project with the right structure out of the box

Prior to this release, building a plugin required piecing together conventions from the existing plugin interface, which was powerful but underdocumented for simple tool use cases. `defineToolPlugin` creates an opinionated, well-typed entry point for the most common pattern: plugins that expose tools. The generated manifest metadata means ClawHub can inspect a plugin's capabilities accurately without executing it.

This lands alongside the note that `legacy interactive/Slack directive producer APIs` are now deprecated via the new `plugins/messages` presentation capability limits. If you're maintaining an older plugin that produces rich Slack-style directives, this release is a good time to check the migration path.

## Browser: Modal Dialogs Surface in Snapshots

The browser plugin gets a quality-of-life fix that matters for agentic flows: pending and recently handled modal dialogs now appear in browser snapshots. When an action opens a modal, the system returns a `blockedByDialog` signal, and the `browser dialog --dialog-id` command can answer pending dialogs directly.

This closes a category of stalls where agents would attempt a click or fill, trigger an unexpected dialog, and then have no visibility into why subsequent actions failed. Now the dialog is surfaced, and the agent can handle it explicitly.

## HTTPS Proxy Support (PR #79171)

[PR #79171](https://github.com/openclaw/openclaw/pull/79171) (thanks to [@jesse-merhi](https://github.com/jesse-merhi)) adds managed HTTPS forward-proxy endpoints and scoped `proxy.tls.caFile` CA trust for proxy endpoint TLS.

Combined with Proxyline — OpenClaw's process-global egress routing layer — this gives operators a complete path for routing OpenClaw traffic through a corporate or managed proxy that terminates its own TLS. Custom CA bundles can now be scoped to the proxy endpoint, which is a prerequisite for many enterprise network environments.

## GPT-5.1, 5.2, and 5.3 Model Refs Fixed

A fix that'll unblock anyone testing newer OpenAI models: beta.6 stops rejecting available `openai-codex` GPT-5.1, GPT-5.2, and GPT-5.3 model refs during config validation. These were being refused by the validator while still being available from the provider. The removed Spark aliases remain correctly suppressed.

## Notable Fixes

Several fixes address reliability issues that surface in long-running deployments:

- **Subagent registry writes are now required before reporting spawn accepted** — previously, if the registry write failed, an untracked subagent run could be lost silently ([#83146](https://github.com/openclaw/openclaw/pull/83146))
- **Kept subagent runs survive past the session sweep TTL** — run-mode `keep` entries no longer disappear after cleanup ([#83168](https://github.com/openclaw/openclaw/pull/83168))
- **Feishu subagent completions route back to the correct DM or topic** ([#83190](https://github.com/openclaw/openclaw/pull/83190))
- **Telegram isolated long polling fixed** to avoid false disconnects and restart loops on idle bots with high `timeoutSeconds` — a subtle bug that caused unnecessary reconnect churn ([#83264](https://github.com/openclaw/openclaw/issues/83264))
- **Gateway hot-reload continues restarting remaining channels** when one channel restart fails, instead of stopping the full reload ([#83054](https://github.com/openclaw/openclaw/issues/83054))
- **Memory QMD now handles hyphenated queries** without falling back to the builtin index for dashed identifiers and dates

## Mac App Settings Redesign

The macOS app gets a visual refresh to its Settings pages: consistent card layouts, cached navigation, and cleaner panes for permissions, voice, skills, cron, exec, and debug. The Cron Jobs pane also fixes a SwiftUI metadata crash that affected some users.

## Updating

```bash
npm install -g openclaw@latest
```

The full changelog is on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.6).
