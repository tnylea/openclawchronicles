---
title: "OpenClaw 2026.8.1 Stable Release Lands"
excerpt: "OpenClaw 2026.8.1 ships conversation search, cloud sessions, durable progress cards, private credential prompts, and verified release artifacts."
coverImage: '/assets/images/posts/openclaw-2026-8-31-stable-2026-8-1-release.png'
date: '2026-08-31T08:00:00.000Z'
dateFormatted: August 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-31-stable-2026-8-1-release.png'
---

OpenClaw 2026.8.1 is now available as a stable release, turning a large August beta cycle into a verified production build. The release was published on GitHub on August 31st, and its notes point operators to the matching documentation page, npm package, platform builds, Docker images, macOS artifacts, and ClawHub mirror proof.

The headline is not one single feature. It is a broad platform release that makes OpenClaw feel more durable across long-running work: past conversation search, cloud or paired-device sessions, persistent progress cards, structured questions, interactive results, safer credential collection, and one-time approvals for recurring automation.

Official source: [OpenClaw 2026.8.1 release](https://github.com/openclaw/openclaw/releases/tag/v2026.8.1).

## What Changed

The release notes call out several product-level additions that matter for daily operators:

- Conversation search can find exact words or phrases in visible conversation text and reopen nearby context.
- Sessions can run beyond the local Gateway on paired devices or cloud workers, with warm machines and project seeds reused later.
- Durable progress cards survive reloads and expose subagent activity, plans, and accumulating edits.
- Structured questions can be answered from web, native cards, messaging buttons, or plain text.
- Chat widgets can be pinned to dashboards, granted specific actions, and exported as rendered images.
- Private credential requests collect secrets through masked prompts instead of putting values in chat or model context.
- Automation permissions can be granted once for an exact operation, then inspected or revoked later.

For teams and heavier installs, the release also expands shared credentials, operator roles, explicit model allowlists, session permission modes, cloud lifecycle controls, workboards, plugin trust review, and backup recovery.

## Upgrade Notes

Two breaking migrations deserve attention before operators upgrade.

First, the bundled OpenProse plugin and `/prose` command are removed. The release notes direct users to run `openclaw doctor --fix` to clean stale configuration while preserving existing `.prose` source files for the upstream Agent Skill migration.

Second, shipped `codex/*` and `openai-codex/*` model references move to `openai/*`. The migration is handled through Doctor, including provider config, stored sessions, and automation routes, with conflicts flagged for operator repair.

The release also warns plugin authors about SDK migration deadlines coming on September 1st, 2026. Several broad plugin SDK subpaths are being retired in favor of focused imports such as `openclaw/plugin-sdk/channel-outbound`, `openclaw/plugin-sdk/channel-inbound`, `openclaw/plugin-sdk/config-mutation`, and runtime-specific helpers.

## Verification Status

The 2026.8.1 release includes unusually detailed publication proof. The npm package and all 93 packages were verified with registry signatures and Sigstore provenance, while 89 plugin runtime checks passed. Windows installers, Docker images, macOS app artifacts, and a local Gateway live-agent smoke were also verified.

There are still caveats. The release notes say Volcengine's ClawHub mirror was deferred because of a community runtime-ID conflict, although the official npm package was verified. Telegram, MiniMax, and catalog/subprocess flakes were waived rather than passed. The higher beta line remains `2026.9.1-beta.1`.

That makes 2026.8.1 a stable release with strong artifact coverage, but not a blank-check upgrade. The practical path is to back up state, run Doctor, watch the model-route and OpenProse migrations, then verify Gateway startup after the update.

