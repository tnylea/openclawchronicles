---
title: "OpenClaw 2026.9.2 Adds GPT-6 Astra Support"
excerpt: "OpenClaw 2026.9.2 ships GPT-6 Astra support, faster chat, stronger restart recovery, safer backups, live settings updates, and a new plugin UI lab preview."
coverImage: '/assets/images/posts/openclaw-2026-9-5-v2026-9-2-release.png'
date: '2026-09-05T23:00:00.000Z'
dateFormatted: September 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-5-v2026-9-2-release.png'
---

OpenClaw shipped [v2026.9.2](https://github.com/openclaw/openclaw/releases/tag/v2026.9.2) on September 5, 2026 at 20:00 UTC, and it is a broad stable release rather than a narrow patch train. The official notes lead with faster chat, stronger upgrade recovery, GPT-6 Astra support, restart-resilient replies, safer backups, and more settings that can apply without restarting the Gateway.

The release also reached npm as `openclaw@2026.9.2`, with a matching registry tarball at `https://registry.npmjs.org/openclaw/-/openclaw-2026.9.2.tgz`. That makes this the new public version to watch for fresh installs and upgrades.

## What Stands Out

The headline model change is GPT-6 Astra support. The release notes say OpenClaw users can select `openai/gpt-6-astra` with an OpenAI API-key profile or an eligible ChatGPT/Codex account. The supported surface includes text and image input, Responses tool calls, and reasoning controls where account discovery confirms availability.

For day-to-day use, the largest practical improvement may be responsiveness. OpenClaw says chat, dashboards, and session interactions now stay more responsive while long transcripts and disk usage work are processed. The release connects that to direct dashboard lookup, less cold-load work, and durable history reads outside the Gateway event loop.

This is the kind of change that matters most in mature agent deployments. Once a Gateway has many sessions, dashboards, attachments, tools, and background workers, raw model quality is only part of the experience. The runtime has to keep the operator interface alive while heavy history work is happening.

## Upgrades And Recovery

The release also puts significant weight on update reliability. OpenClaw says automatic updates now retain active settings, enabled skills, and default-agent ownership, while Gateway restart recovery reports outcomes with more actionable guidance.

That follows several recent patches that made update failures and restart transitions less silent. The release continues that direction: operators should get clearer success, failure, or intentional-skip outcomes instead of being left to infer what happened after a restart.

Reply recovery also gets a release-level mention. OpenClaw now works to recover active, queued, and delegated replies after Gateway restarts without letting one completed reply discard another recovery marker. It also keeps continuation instructions through compaction and retry attempts.

## Safer Data Handling

Backups receive a quieter but important set of fixes. OpenClaw says Git backups now preserve complete text containing embedded NUL characters, support Nix-managed config and credential links, and reject corrupt archive headers instead of accepting incomplete backups.

That is a useful hardening step for self-hosted operators. Backup systems are only trustworthy if they preserve unusual but valid data and fail closed when archives are suspect.

The release also calls out more live settings updates. Agent, model, tool, channel, browser, node, access, and terminal settings can apply through their running owners where supported, while restart-required settings remain marked in the configuration reference.

## Other Notable Changes

Several new user-facing capabilities landed under the changes section:

- Plugin icons now live at `assets/icon.png` inside the package instead of a top-level manifest URL.
- Settings includes an experimental Custom plugin UI lab for Control UI pages, panels, session actions, composer customization, and workspace customization.
- Standalone Apple Watch Talk is experimental, with Gateway-owned tools and transcripts.
- Swarm orchestration is enabled by default while preserving explicit opt-outs.
- Dashboard layouts now include gallery browsing and more flexible panel placement.
- Slack gets richer reply guidance and native session controls.
- Native iOS and macOS text copying improves message and code-block handling.

The release notes include a long fixes section covering Doctor diagnostics, HTTP proxy safety, session cleanup, Skill Workshop backups, Telegram proxy media, Discord voice, Mattermost recovery, plugin setup repair, cron behavior, memory recovery, and more.

For existing OpenClaw users, v2026.9.2 looks like an infrastructure release with visible product edges: new model support, smoother dashboards, fewer update surprises, and more durable data handling.
