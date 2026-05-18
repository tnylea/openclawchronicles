---
title: "OpenClaw v2026.5.16-beta.4: Slack Threads, xAI OAuth, and a Big Fixes Wave"
excerpt: "OpenClaw beta.4 lands with Slack assistant threads, xAI Grok OAuth, new music providers, Chinese localization, and dozens of targeted fixes."
coverImage: '/assets/images/posts/openclaw-2026-5-17-beta4-release.png'
date: '2026-05-17T08:00:00.000Z'
dateFormatted: May 17th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-17-beta4-release.png'
---

OpenClaw shipped **v2026.5.16-beta.4** overnight (May 17, 04:22 UTC), wrapping a dense sprint into one of the bigger pre-release drops in recent memory. The changelog spans new provider integrations, platform expansions, group-chat controls, and an unusually thorough round of robustness fixes. Here is what is worth knowing.

## Slack Finally Gets Native Assistant Thread Support

The most user-visible addition in beta.4 is proper Slack assistant thread lifecycle support ([#80787](https://github.com/openclaw/openclaw/issues/80787)). OpenClaw now handles the full Slack assistant manifest — including suggested prompts, thread-scoped assistant sessions, and Slack-provided assistant context — meaning your bot no longer needs workarounds to behave like a first-class Slack app assistant. If you have been waiting on this one, it is in.

## xAI Grok OAuth for SuperGrok Subscribers

SuperGrok subscribers can now authenticate `xai/*` models, media tools, and other xAI providers through OAuth login, removing the requirement to generate and paste an `XAI_API_KEY`. The flow mirrors existing OAuth provider integrations (Anthropic, GitHub Copilot, etc.) and works for both inference and xAI's media/tool endpoints.

## New Music Generation Providers: fal and OpenRouter

The shared `music_generate` tool picks up two new provider backends:

- **fal** — MiniMax Music, ACE-Step, and Stable Audio endpoints
- **OpenRouter** — Lyria audio output via the OpenRouter routing layer

Both integrate into the same `music_generate` skill tooling you already use, so no config changes are needed beyond pointing at the new provider names.

## Group Chat: Unmentioned Inbound Classification

A new opt-in config key `messages.groupChat.unmentionedInbound: "room_event"` ([#81317](https://github.com/openclaw/openclaw/pull/81317)) lets agents receive unmentioned group chatter as quiet background context. The agent processes it silently unless it explicitly calls the message tool to reply — useful for bots that should stay aware of room state without reacting to every message. This is a significant quality-of-life win for always-on group deployments.

## Mac App Remote Setup Gets a CLI Path

`openclaw-mac configure-remote` can now pre-configure remote setup before the GUI onboarding runs, and the app skips onboarding entirely when remote config is already complete. It also supports direct LAN and Tailnet gateway URLs, allows private same-origin Control UI loads, and takes ownership of the SSH tunnel process when SSH is the selected transport.

## CLI Localization: English, Simplified Chinese, Traditional Chinese

The setup wizard and bundled channel setup flows ([#80645](https://github.com/openclaw/openclaw/pull/80645)) now ship in three languages: English, Simplified Chinese, and Traditional Chinese. This is the first i18n step for the CLI onboarding surface.

## Security Audit Suppressions

`security.audit.suppressions` ([#76949](https://github.com/openclaw/openclaw/pull/76949)) lets you mark specific audit findings as intentionally accepted. Suppressed matches are excluded from the active summary but preserved in JSON output with a suppression notice, keeping your audit clean without hiding the paper trail.

## `openclaw cron run --wait`

The cron CLI gains `--wait` with configurable timeout and poll interval ([#81929](https://github.com/openclaw/openclaw/pull/81929)), plus `cron.runs --run-id` filtering to block on a single queued manual run. CI pipelines that trigger cron jobs and wait for their output can now do so without custom polling scripts.

## Notable Fixes

- **Gateway/exec approvals**: path-shaped allowlists now bind to the executable realpath, so symlinked binaries cannot retain approval after retargeting ([#45595](https://github.com/openclaw/openclaw/issues/45595)).
- **macOS LaunchAgent logs**: stdout now writes to `~/Library/Logs/openclaw`, stderr is suppressed, and stdin is attached to `/dev/null` — fixing symlinked state-dir log failures and silent module-evaluation hangs on launchd startup.
- **Memory-core incremental sync**: startup now scans persisted memory source sessions incrementally, only re-indexing missing, newer, or resized files instead of a full rebuild.
- **Telegram polling offset persistence**: polling offsets are now persisted only after main-thread dispatch, fixing consumed-but-unrouted updates that would silently disappear across restarts.
- **Control UI provider quota**: quota usage now appears in the Overview card and Chat header, with stale in-progress state recovered after missed terminal events.

## What Is Next

Beta.4 is a pre-release. The commit stream is still active — several May 17 PRs (up to [#82953](https://github.com/openclaw/openclaw/pull/82953)) have merged since the tag. Expect a follow-up beta or a release candidate once the current churn stabilizes.

Full release notes: [github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.4](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.4)
