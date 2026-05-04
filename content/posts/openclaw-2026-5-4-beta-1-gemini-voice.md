---
title: "OpenClaw 2026.5.4 Beta Brings Gemini Voice Bridge to Google Meet"
excerpt: "OpenClaw v2026.5.4-beta.1 ships a Gemini voice bridge for Twilio Meet calls, unified streaming progress drafts across all channels, and the new /steer command."
coverImage: '/assets/images/posts/openclaw-2026-5-4-beta-1-gemini-voice.png'
date: '2026-05-04T23:00:00.000Z'
dateFormatted: May 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-4-beta-1-gemini-voice.png'
---

Less than twelve hours after shipping the v2026.5.3 stable release, the OpenClaw team tagged **v2026.5.4-beta.1** on Monday evening — and it is a substantial one. The beta introduces a Gemini-powered voice bridge for Google Meet, unified streaming progress drafts that work across every major chat platform, and the new `/steer` command for queue-independent agent guidance.

## Gemini Voice Bridge for Twilio-Powered Meet Calls

The headline feature is a significant rework of OpenClaw's Google Meet integration. Previously, Twilio dial-in joins fell back to TwiML for realtime speech, which introduced noticeable lag and choppy delivery. With v2026.5.4-beta.1, Twilio dial-in is routed through the Gemini voice bridge instead, adding:

- **Paced audio streaming** — audio is buffered in chunks before delivery, removing the bursts that made the agent sound uneven.
- **Backpressure-aware buffering** — the Twilio audio queue is now bounded, and overloaded realtime streams are closed before audio can pile up behind the WebSocket backpressure guard.
- **Barge-in queue clearing** — when a human participant speaks, any queued agent speech is cleared immediately, so the agent stops mid-sentence rather than finishing its queued reply.

The net result is what the release notes describe as "a much snappier OpenClaw voice agent" for Google Meet participants. The PR driving this change is [#77064](https://github.com/openclaw/openclaw/pull/77064), contributed by [@scoootscooob](https://github.com/scoootscooob).

Meet joins also now fork the calling agent's current transcript into the consultant session, so the in-meeting agent has full context from the tool call that triggered the join — rather than starting from scratch.

## Unified Streaming Progress Drafts Across All Channels

OpenClaw's streaming layer received a major consistency upgrade. The new `streaming.mode: "progress"` option now works identically across Discord, Telegram, Matrix, Slack, and Microsoft Teams. Each channel gets a live progress draft that auto-generates a single-word status label as the agent works, and operators can share a single `streaming.progress.*` config block across all platforms.

Slack gets an extra enhancement: `streaming.progress.render: "rich"` enables Block Kit progress drafts backed by structured progress-line data, with automatic trimming when Block Kit's message-length limits would otherwise cause reflow. Thanks to [@vincentkoc](https://github.com/vincentkoc) and [@BunsDev](https://github.com/BunsDev) for the Slack polish.

Two new visibility controls also arrive: `streaming.preview.commandText` and `streaming.progress.commandText` can each be set to `"status"` to hide raw exec command text in streaming progress lines while still surfacing status — useful for keeping output clean in shared channels without completely disabling progress updates.

## The /steer Command

A long-requested capability lands in this beta: `/steer` sends queue-independent guidance to the active current-session run without starting a new turn when the session is idle. Unlike sending a new message, `/steer` reaches the agent mid-run — think of it as tapping the agent on the shoulder while it is already working, without queuing behind whatever it is doing. See [PR #76934](https://github.com/openclaw/openclaw/pull/76934).

A smaller but handy alias also ships: `/side` is now available as a text and native slash-command alias for `/btw` side questions, letting you drop quick context without interrupting the main thread.

## Control UI and Gateway Improvements

The Control UI picks up several quality-of-life additions in this beta:

- **Breadcrumb agent names** — the active agent name now appears in dashboard breadcrumbs without adding the session key, keeping non-chat views oriented without crowding the topbar.
- **Collapsible cron sidebar** — the New Job form can be collapsed so the jobs list reclaims screen real estate, courtesy of [@BunsDev](https://github.com/BunsDev).
- **Duplicate message collapse** — consecutive identical text messages (like heartbeat `OK` acknowledgements) now collapse into a single bubble with a count badge, reducing visual noise.
- **Chat picker** — an agent-first filter arrives in the session picker, with responsive layout across phone, tablet, and desktop widths.

On the Gateway side, startup performance continues to improve: the heavy cron runtime now loads lazily after the ready signal, and the startup benchmark supports per-run V8 CPU profiles with `--cpu-prof-dir` for easier profiling without disturbing port cleanup defaults.

## What Else Is In the Beta

Beyond the headliners, the changelog includes:

- **Exec approval explainer** — a tree-sitter-backed shell command explainer has been added as groundwork for future approval and command-review surfaces ([#75004](https://github.com/openclaw/openclaw/pull/75004)).
- **WhatsApp Channel/Newsletter targets** — explicit `@newsletter` outbound message targets now work with channel session metadata instead of DM routing.
- **OpenRouter response caching** — an opt-in `X-OpenRouter-Cache` header is sent on verified OpenRouter routes, with configurable TTL.
- **DeepSeek V4 thinking levels** — `xhigh` and `max` thinking levels are now exposed through the lightweight provider-policy surface and Control UI `/think` pickers.
- **media/images** — HEIC/HEIF attachments now fail closed when optional Sharp conversion is unavailable, rather than sending unconverted originals.

## How to Install

v2026.5.4-beta.1 is available on npm under the `beta` dist-tag:

```bash
npm install -g openclaw@beta
```

Running `openclaw doctor --fix` after updating is recommended to migrate any legacy config keys. The full changelog is on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.4-beta.1).
