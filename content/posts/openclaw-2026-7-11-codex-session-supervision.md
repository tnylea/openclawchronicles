---
title: "OpenClaw Adds Native Codex Session Supervision"
excerpt: "OpenClaw can now discover native Codex sessions, continue eligible local work in Chat, and archive completed sources with explicit safety checks."
coverImage: '/assets/images/posts/openclaw-2026-7-11-codex-session-supervision.png'
date: '2026-07-11T08:02:00.000Z'
dateFormatted: July 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-11-codex-session-supervision.png'
---

OpenClaw merged a large Codex integration update in [PR #104045](https://github.com/openclaw/openclaw/pull/104045): native Codex session supervision is moving into the official `codex` plugin.

The change is aimed at users running OpenClaw alongside Codex and the OpenClaw Mac app. Previously, local and paired Mac Codex sessions could be visible as a fleet, but they were mostly read-only inventory. Users could not naturally open one, continue work through Codex AppServer, or archive completed local source sessions from the same OpenClaw workflow.

## Supervision Moves Into The Codex Plugin

The new supervision path lives behind `plugins.entries.codex.config.supervision.enabled`. Once enabled, the official Codex plugin can expose a non-archived, host-federated catalog of Codex sessions.

That catalog gives OpenClaw a more useful view of native Codex work without pretending every session is fully takeover-ready. The first phase supports a careful subset:

- Discover active native Codex sessions on the local Mac and paired Macs.
- Continue eligible local stored or idle sessions in OpenClaw Chat.
- Keep continuations on the Codex AppServer runtime.
- Archive eligible local source threads after fresh ownership, status, and idle checks.
- Show offline hosts and remote sessions without exposing transcript content.

Guided setup now detects a native Codex installation independently of the primary OpenClaw model and can enable supervision when policy allows.

## Continuation Uses A Snapshot Boundary

The safety boundary is the most important part of the feature. OpenClaw is not claiming exact cross-process takeover of an arbitrary running Codex thread.

Instead, eligible local continuation imports bounded visible history into a new Codex branch and creates a model-locked OpenClaw Chat continuation through the Codex AppServer harness. That gives users a practical way to keep moving while avoiding unsafe assumptions about another runner's live ownership.

Paired-node catalogs are read-only in this phase. Remote continue and remote archive are explicitly out of scope until there is a duplex runner and an explicit lease protocol.

## Archive Requires Ownership Checks

Archiving local source sessions also has guardrails. The PR says local source archive requires explicit confirmation that no other runner owns the session, plus fresh status and idle checks.

That is the right default for a feature that touches another tool's working state. Archiving completed work is useful, but only if OpenClaw can avoid racing an active Codex process.

## The Validation Was Broad

The test evidence covered the plugin, agent harness, gateway methods, UI, browser E2E flow, TypeScript checks, macOS tests, and documentation/i18n checks. The E2E scenario specifically covered search, pagination, continuation, archive, and offline-host preservation.

For users, the result is a cleaner bridge between OpenClaw and Codex. Native Codex work can show up where OpenClaw users already supervise agents, while continuation and archive behavior stays inside explicit, documented limits.

This looks like the first serious step toward OpenClaw treating Codex sessions as first-class supervised work without blurring process ownership.
