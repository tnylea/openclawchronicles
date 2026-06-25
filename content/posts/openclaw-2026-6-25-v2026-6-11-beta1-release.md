---
title: "OpenClaw 2026.6.11 Beta Adds Channel Control"
excerpt: "OpenClaw 2026.6.11-beta.1 expands channel control, remote wake-up workflows, mobile settings, plugin distribution, and agent reliability."
coverImage: '/assets/images/posts/openclaw-2026-6-25-v2026-6-11-beta1-release.png'
date: '2026-06-25T08:00:00.000Z'
dateFormatted: June 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-25-v2026-6-11-beta1-release.png'
---

OpenClaw published [`v2026.6.11-beta.1`](https://github.com/openclaw/openclaw/releases/tag/v2026.6.11-beta.1) late Wednesday UTC, starting the next beta line after the stable 2026.6.10 release. The release notes group more than 300 merged PRs into a practical theme: better control over where agents run, how channels behave, and how operators recover when long agent turns go sideways.

The release was published at 23:37 UTC on June 24th. That places it just after the previous OpenClaw Chronicles nightly scan, making it the headline Tier 1 item for the June 25th morning run.

## Channel Control Moves Forward

The biggest user-facing theme is channel control. The release highlights Slack relay mode, native Mattermost `/oc_queue`, and per-DM model overrides as examples of more capable channel operations.

Those changes matter because OpenClaw is increasingly used across group chat, direct messages, and routed channel workflows rather than a single local terminal. The same agent may need different routing behavior in a team Slack channel than it needs in a private DM. Per-DM model overrides also make it easier to tune cost, latency, or provider behavior without changing the entire gateway.

The release points to [PR #94707](https://github.com/openclaw/openclaw/pull/94707), [PR #95546](https://github.com/openclaw/openclaw/pull/95546), and [PR #95120](https://github.com/openclaw/openclaw/pull/95120) for that work.

## File-Driven And Remote Workflows

The beta also adds two operator workflow improvements: `openclaw agent --message-file` and a RAFT CLI wake bridge. These are not flashy features, but they are exactly the kind of interfaces that make OpenClaw easier to automate.

`--message-file` gives operators a cleaner way to hand larger prompts or generated instructions to an agent without packing everything into a shell command. The RAFT wake bridge is aimed at remote wake-up paths, which matters for setups where agents are reachable through gateway or node layers rather than a constantly attended local prompt.

Together, they make OpenClaw feel less like a manual chat tool and more like infrastructure that can be driven by scripts, queues, and remote events.

## Safer Plugin Distribution

The release notes also call out externalized official plugins and bundled plugin icon metadata. This follows a busy week of ClawHub and plugin distribution work, including pinned version installs and owner-qualified skill installs covered earlier by OpenClaw Chronicles.

For users, the direction is clear: more of OpenClaw's provider and integration surface is moving through plugin-style distribution. That makes compatibility metadata, source identity, and installer behavior more important than ever. A beta that strengthens official plugin packaging is worth watching even if the visible change is mostly metadata.

## Reliability Work Under The Surface

The final major theme is agent-turn reliability. The release notes mention Codex partial deltas, selected harness plugin activation, and long-context prompt-cache stability. Those changes are linked to [PR #95404](https://github.com/openclaw/openclaw/pull/95404), [PR #95652](https://github.com/openclaw/openclaw/pull/95652), and [PR #95624](https://github.com/openclaw/openclaw/pull/95624).

That cluster should be interesting to anyone running long or tool-heavy OpenClaw sessions. Lost progress, inconsistent harness activation, or unstable prompt-cache behavior are the kinds of problems that can make agent runs feel unreliable even when the core model call succeeds.

## How To Test It

Because this is a beta release, production users should read the full notes and decide whether the channel and plugin improvements justify early adoption.

For npm-based testing:

```bash
npm install -g openclaw@2026.6.11-beta.1
```

Read the full changelog and verification notes on the [OpenClaw `v2026.6.11-beta.1` release page](https://github.com/openclaw/openclaw/releases/tag/v2026.6.11-beta.1).
