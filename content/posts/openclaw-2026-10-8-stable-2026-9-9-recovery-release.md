---
title: "OpenClaw 2026.9.9 Ships Stable Recovery Fixes"
excerpt: "OpenClaw 2026.9.9 is a stable release focused on update recovery, messaging reliability, model support, and safer maintenance paths."
coverImage: '/assets/images/posts/openclaw-2026-10-8-stable-2026-9-9-recovery-release.png'
date: '2026-10-08T23:00:00.000Z'
dateFormatted: October 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-8-stable-2026-9-9-recovery-release.png'
---

OpenClaw published [v2026.9.9](https://github.com/openclaw/openclaw/releases/tag/v2026.9.9) today, moving a broad set of reliability work into the stable channel. The release notes describe a large update: 112 pull requests, 69 direct commits, and 91 contributors.

The headline is not one flashy feature. It is a practical stable release for operators who care about upgrades, failed-update recovery, channel delivery, and model availability. The [official changelog](https://raw.githubusercontent.com/openclaw/openclaw/main/CHANGELOG/2026.9.9.md) summarizes the release as adding GPT-6.1 Sol to the Codex model list, supporting Claude Haiku 5.5 through Anthropic and Claude CLI, improving failed-update recovery, fixing missing iMessage replies, and preventing an old scheduled job from interrupting a newer conversation.

## Recovery Gets the Most Attention

The release gives unusual space to update and maintenance behavior. That makes sense: OpenClaw runs long-lived agents, scheduled jobs, channel integrations, plugin state, and local databases. A rough update can turn into an operational mess quickly.

Among the notable maintenance fixes:

- Failed-update recovery can preserve data written during a supported failed attempt.
- Returning to 2026.9.8 keeps later updates possible.
- macOS and Linux restarts stay blocked until Doctor processes are confirmed stopped.
- Backups and restores on FUSE storage avoid failing solely because file times changed.
- Doctor can continue older memory-database upgrades past oversized or damaged saved entries.
- Session archive repairs can resume after interruption.

That set of changes points to a release shaped by real field failures rather than just planned features. The notes repeatedly call out upgrade loops, rollback behavior, damaged metadata, interrupted repairs, and compatibility with older installations.

## Messaging and Scheduling Fixes

OpenClaw 2026.9.9 also tightens several channel paths. The release says affected iMessage replies that were written but never sent are now delivered. Discord delegated task results are recognized as delivered when the answer already appeared in the thread. Google Chat and Slack replies retain their original threads in the covered paths.

Scheduled jobs also get a meaningful fix. An older job reaching its time limit could stop a newer conversation in the same session and remove its tool access. That is now covered, which matters for anyone using automations alongside normal chat work.

## Model Support Moves Forward

The release adds GPT-6.1 Sol to the Codex model list, while noting that use still depends on an eligible account and compatible Codex setup. Claude Haiku 5.5 is now selectable through both Anthropic API and Claude CLI routes, and the `haiku` alias now points to 5.5.

The bundled Codex copy also moves to 0.160.0. OpenClaw is careful to distinguish that bundled copy from any standalone Codex CLI a user updates separately.

## Why This Release Matters

Stable releases are where operational fixes become broadly useful. The October beta line has been carrying fast-moving recovery, Doctor, messaging, model, plugin, and scheduler work. Version 2026.9.9 brings a large portion of that reliability story to users who follow stable npm releases.

The npm package has also advanced to [openclaw 2026.9.9](https://www.npmjs.com/package/openclaw/v/2026.9.9), matching the GitHub release.

For operators, the short version is simple: this is a maintenance-heavy stable update with real upside if you have seen update failures, Doctor repair interruptions, missing channel replies, or model-picker drift. It is less about changing how OpenClaw feels day to day and more about making the system recover cleanly when the day goes sideways.
