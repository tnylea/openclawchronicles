---
title: "OpenClaw Imports Claude Desktop Session Groups"
excerpt: "OpenClaw now reads Claude Desktop custom groups from local Chromium storage and preserves those labels in the Control UI session catalog."
coverImage: '/assets/images/posts/openclaw-2026-7-20-claude-desktop-groups.png'
date: '2026-07-20T08:02:00.000Z'
dateFormatted: July 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-20-claude-desktop-groups.png'
---

OpenClaw's connected coding-agent catalog gained a useful bit of Claude Desktop awareness this morning. [PR #111644](https://github.com/openclaw/openclaw/pull/111644), titled "feat(anthropic): import Claude Desktop custom groups," reads Claude Desktop's local custom-group metadata and carries it through OpenClaw's Gateway protocol into the Control UI.

The change is deliberately read-only. OpenClaw reads Claude Desktop custom-group labels and `local_*` memberships from Claude Desktop's account-local Chromium LevelDB store without writing back to it. That gives OpenClaw enough information to keep session organization familiar while avoiding ownership confusion with Claude Desktop's own storage.

## What Users See

The resolved Claude Desktop label is exposed as optional `customGroup` metadata in the session catalog. In the Control UI, those custom groups are displayed ahead of project grouping, so sessions organized in Claude Desktop can appear in a more recognizable structure when surfaced through OpenClaw.

That matters for users who work across several coding assistants or keep many Claude Desktop sessions active. A flat catalog is workable when there are a handful of sessions. It becomes noisy once different projects, experiments, and long-running threads accumulate. Importing existing group labels lets OpenClaw meet the user's current organization instead of forcing a new mental model.

## The Storage Detail

The PR is also interesting because of how it avoids a brittle parsing shortcut. A follow-up commit notes that the earlier approach matched labels across whole decompressed LevelDB blocks, which could misattribute labels depending on byte order. The final implementation parses SSTable entries more structurally, handles prefix-delta keys, honors the newest sequence per user key, and keeps WAL writes ahead of SSTable data.

In plain English: OpenClaw now tries to read the local Chromium storage like a database rather than scraping chunks of bytes and hoping the nearest-looking label is the right one.

## Validation

The author reports validation with Anthropic extension tests, extension type checks, protocol checks, docs formatting and linting, markdown docs checks, and a local autoreview run. The PR also includes decoder coverage for Snappy copy records and protocol coverage for the new catalog metadata.

This is not a headline-grabbing feature, but it fits the larger direction of OpenClaw's Control UI: connected coding-agent sessions should feel native, searchable, and organized, even when the originating tool is outside OpenClaw itself.
