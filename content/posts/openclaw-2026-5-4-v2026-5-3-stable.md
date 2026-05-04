---
title: "OpenClaw v2026.5.3: Streaming Progress Drafts, File Transfer, and 110+ Contributors"
excerpt: "OpenClaw v2026.5.3 stable lands with streaming progress mode, a file-transfer plugin, /steer command, and hardened gateway config."
coverImage: '/assets/images/posts/openclaw-2026-5-4-v2026-5-3-stable.png'
date: '2026-05-04T14:00:00.000Z'
dateFormatted: May 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-4-v2026-5-3-stable.png'
---

OpenClaw v2026.5.3 dropped this morning (07:01 UTC), and it's a dense one. This stable release brings together months of work from 110+ contributors — streaming progress drafts, a brand-new file-transfer plugin, real-time steering of active sessions, hardened gateway config, and a pile of bug fixes across memory, macOS, Google Meet, and more.

Here's everything that matters.

## Streaming Progress Drafts

The most visible UX improvement in this release: `streaming.mode: "progress"`. Set it in your config and OpenClaw will post live draft updates as a session runs, rather than waiting for the final response.

This works across Discord, Telegram, Matrix, Slack, and Microsoft Teams. Each update carries an auto-generated single-word status label — a terse signal of what the agent is currently doing. Less "waiting in the dark," more "watching the machine think."

## New Commands: `/steer` and `/side`

Two new commands that make interacting with running sessions much smoother:

**`/steer`** — Steer an active session run without touching its queue. If OpenClaw is mid-task and you want to redirect or refocus it, `/steer` lets you do that live. No need to cancel and restart. (PR #76934)

**`/side`** — An alias for `/btw`, for asking side questions while a session is running. Small convenience, but one that removes a memory burden ("wait, was it `/btw` or `/side`?").

## File-Transfer Plugin

PR #74742 by @omarshahine introduces a full file-transfer plugin for paired nodes. It exposes four tools:

- `file_fetch` — pull a file from a paired node
- `dir_list` — list contents of a remote directory
- `dir_fetch` — fetch an entire directory
- `file_write` — write a file to a paired node

Security posture is sensibly restrictive by default: **default-deny path policy**, symlink refusal, and a 16MB ceiling per transfer. Paired node file access is genuinely useful for agentic workflows, and the defaults mean you won't accidentally expose your entire filesystem.

## WhatsApp Channel / Newsletter Targets

WhatsApp users finally get explicit newsletter/channel outbound support. Use `@newsletter` as a target to send messages to WhatsApp Channel subscribers. This was a long-standing gap (fixes #13417) and brings WhatsApp in line with other platform outbound capabilities.

## Gateway: Lazy-Loading and Config Hardening

Two gateway improvements that affect startup reliability and configuration safety:

**Lazy-loading** — Startup and Control UI hot paths have been trimmed. Maintenance timers are now deferred, which means the gateway starts faster and does less upfront work on initialization.

**Config hardening** — Invalid configurations now **fail closed** rather than silently continuing in a degraded state. If your config is broken, the gateway won't start. More importantly, `doctor --fix` now owns the repair path — run it to fix what it can safely fix, without touching things it can't.

## Plugin Ecosystem Hardening

Several improvements to how plugins are managed:

- **Onboarding installs optional plugins** — the setup flow now handles optional plugin installation properly
- **ClawHub 429 annotations** — rate-limit responses from ClawHub are now annotated correctly
- **Beta channel update paths** — plugins on beta channels follow proper update routes
- **`plugins list --json`** — now includes dependency state, so you can see what each plugin needs and whether those needs are met

## Bug Fixes Worth Knowing

**APNs HTTP/2 proxy** (PR #74905, security label) — Fixed direct APNs session proxying. This carries a security label; upgrade if you're using push notifications.

**macOS LaunchAgent upgrade recovery** (PR #76790) — Upgrades that broke the LaunchAgent on macOS are now handled correctly.

**Memory / LanceDB** (fixes #76910) — `apache-arrow` is now properly declared as a dependency in the bundled memory plugin. If you've seen errors around LanceDB and arrow, this is the fix.

**Google Meet** — Three fixes landed: Chrome media permissions are handled correctly, the realtime audio bridge now starts after you've actually joined (not before), and audio responses are sent explicitly rather than implicitly.

**Sandbox sharding** (PR #74831) — The container and browser registry now uses per-runtime shard files. Cleaner isolation, less contention.

**`doctor --fix`** (PR #76800) — The doctor now commits safe legacy migrations even when unrelated issues are detected. Previously, an unrelated problem would block all migrations; now safe ones go through regardless.

## How to Upgrade

```bash
openclaw upgrade
```

Or grab the release directly: [v2026.5.3 on GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.3)

Thanks to all 110+ contributors who shipped this release. It's a big one.
