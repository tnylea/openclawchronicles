---
title: "OpenClaw v2026.5.4 Stable: Gemini Voice, File Transfer, and a Much Faster Gateway"
excerpt: "OpenClaw v2026.5.4 stable ships today with a Gemini-powered Meet voice bridge, a new file-transfer plugin, unified streaming progress drafts, and sweeping gateway startup improvements."
coverImage: '/assets/images/posts/openclaw-2026-5-5-v2026-5-4-stable.png'
date: '2026-05-05T23:00:00.000Z'
dateFormatted: May 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-5-v2026-5-4-stable.png'
---

OpenClaw v2026.5.4 landed as a stable release today, graduating from a busy beta cycle that touched voice calls, file operations, streaming UX, channel reliability, and gateway cold-start performance. Here is what changed.

## Google Meet Gets a Real Voice Bridge

The headline feature is a rewritten voice path for Google Meet Twilio dial-in joins ([#77064](https://github.com/openclaw/openclaw/pull/77064)). Calls now route audio through the realtime Gemini voice bridge instead of the old TwiML fallback, bringing paced streaming, backpressure-aware buffering, and proper barge-in queue clearing. The result: Meet participants hear a much snappier agent response with no awkward silent gaps when the AI is thinking.

A related fix ensures `realtime.introMessage: ""` is respected, so agents configured to join silently actually do.

## File Transfer Plugin Now Bundled

A new bundled `file-transfer` plugin ([#74742](https://github.com/openclaw/openclaw/pull/74742)) adds four agent tools for binary file ops on paired remote nodes:

- `file_fetch` — download a remote file
- `dir_list` — list a directory
- `dir_fetch` — fetch an entire directory tree
- `file_write` — write a file to a paired node

The plugin ships with strict defaults: per-node path policy under `plugins.entries.file-transfer.config.nodes` requires explicit operator approval, symlink traversal is off by default (`opt-in followSymlinks`), and a 16 MB per-round-trip ceiling prevents runaway transfers. This makes remote file management safe enough to automate while keeping the blast radius small.

## Unified Streaming Progress Drafts

A new `streaming.mode: "progress"` configuration lands across Discord, Telegram, Matrix, Slack, and Microsoft Teams simultaneously. Agents can now show live tool-call progress as a single updating draft message — with auto-generated single-word status labels — instead of a flood of individual updates.

Slack gets an additional `streaming.progress.render: "rich"` option that renders Block Kit progress cards with structured data rows. When Block Kit limits force a trim, the newest lines are preserved rather than the oldest.

A companion change introduces compact explain-mode tool summaries for `/verbose` mode and progress drafts by default. Operators who want raw tool output can set `agents.defaults.toolProgressDetail: "raw"`.

## Gateway Startup Is Noticeably Faster

Several rounds of startup optimization landed in this release:

- Model-catalog helpers, QR pairing code, and session lookup are now kept off hot import paths
- Non-readiness sidecars defer until after the ready signal fires
- The heavy cron runtime lazy-loads after the rest of gateway startup
- `jiti` (the TypeScript source-transform loader) is no longer imported on native-loadable plugin paths
- Bundled plugin metadata is fast-pathed on trusted plugins, skipping repeated cold scans ([#77519](https://github.com/openclaw/openclaw/issues/77519), [#77532](https://github.com/openclaw/openclaw/issues/77532))

The combined effect is a meaningfully faster default gateway cold start, especially on installs with several plugins.

## /steer, /side, and More Agent Commands

A new `/steer` command ([#76934](https://github.com/openclaw/openclaw/pull/76934)) lets operators redirect the active run without starting a new turn when the session is idle — useful for nudging a long-running agent mid-task without fully interrupting it.

`/side` is now an alias for `/btw side questions`, giving a shorter path to asking the agent a side question while it works.

## Channel Reliability Improvements

- **Discord**: degraded transport and gateway event-loop starvation now surface as actual status signals in `openclaw channels status` and `openclaw status --deep` ([#76327](https://github.com/openclaw/openclaw/pull/76327)), so intermittent socket resets stop looking like healthy operation
- **WhatsApp**: WhatsApp Channel/Newsletter targets are now supported for outbound messages
- **Telegram**: plugin-owned numeric forum-topic targets now work in the agent message tool
- **Secrets**: `secrets apply` now preserves `keyRef` and `tokenRef` fields so SecretRef metadata survives scrubbing
- **Plugins**: external channel plugins with artifacts in `/dist/` (like `@openclaw/discord` since 2026.5.2) now correctly contribute SecretRef contracts at gateway startup

## Control UI Refresh

The dashboard got several usability improvements: the active agent name appears in breadcrumbs without clutter, the New Job cron sidebar is now collapsible, the chat session picker has an agent-first filter, and the chat composer is responsive across phone/tablet/desktop widths. Consecutive duplicate messages (like heartbeat acknowledgements) now collapse into a single bubble with a count.

## What Else

- `openclaw models auth list [--provider] [--json]` — inspect saved per-agent auth profiles without dumping secrets
- **OpenRouter**: opt-in response caching headers (`X-OpenRouter-Cache`) and expanded app-attribution categories
- **Plugins/SDK**: `before_agent_finalize` now supports bounded retry instructions so workflow plugins can request one more model pass
- **`doctor --fix`**: commits safe legacy migrations even when unrelated validation issues prevent full validation from passing

Full changelog: [github.com/openclaw/openclaw/releases/tag/v2026.5.4](https://github.com/openclaw/openclaw/releases/tag/v2026.5.4)
