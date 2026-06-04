---
title: "OpenClaw 2026.5.22 Stable: Meeting Notes Plugin, Model Cleanup, and Security"
excerpt: "OpenClaw v2026.5.22 goes stable with a new Meeting Notes plugin, Discord Voice capture, retired model cleanup, and npm shrinkwrap supply chain hardening."
coverImage: '/assets/images/posts/openclaw-2026-5-24-v2026522-stable-meeting-notes.webp'
date: '2026-05-24T08:00:00.000Z'
dateFormatted: May 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-24-v2026522-stable-meeting-notes.webp'
---

OpenClaw **v2026.5.22** hit stable this morning, graduating from the beta tag that shipped last week. If you've been holding out for the official release, now's the time to update. The stable build carries everything from the beta — including the [4,100x model listing speedup](https://openclawchronicles.com/posts/openclaw-2026-5-23-v2026522-model-speedup) — plus a wave of new features and fixes that weren't in the pre-release.

Here's what's worth knowing.

## Meeting Notes Plugin Arrives

The biggest new addition in stable is a **source-only Meeting Notes plugin** that lives outside the core npm package. It ships with an SDK source-provider contract, auto-start capture config, manual transcript imports, and read-only CLI access via `openclaw meeting-notes`.

The first live source is **Discord Voice**. When a voice session is active, the plugin can capture and structure a running transcript that the agent can later summarize, search, or reference. Manual transcript import means you can also feed in recordings from other platforms.

This is early-stage — "source-only" means the plugin ingests and stores meeting content rather than acting on it autonomously — but it's a clear signal that meeting context is becoming a first-class primitive in the OpenClaw stack.

## Model Catalog Gets Pruned

v2026.5.22 stable retires a batch of outdated model references: **Groq, GitHub Copilot, OpenAI, xAI, and old Claude catalog entries** have been cleaned out. If you have existing config pointing at any of these retired identifiers, `openclaw doctor --fix` will migrate them to current provider refs automatically.

On the Anthropic side, the **1M token context window now targets GA-capable Claude 4.x models** instead of the retired `context-1m-2025-08-07` beta. If your config referenced that beta header explicitly, it'll be ignored going forward — current Claude 4.x models support the full context window without the beta flag.

These changes make the upgrade path cleaner and reduce the chance of confusing "model not found" errors when config references a stale identifier.

## Supply Chain Hardening: Shrinkwrap Ships

Security-minded users will appreciate a quiet but important change: OpenClaw's root npm package and all OpenClaw-owned npm plugins now **ship with generated shrinkwrap files**. Bundled plugin runtime dependencies are included in suitable tarballs, and lockfile and shrinkwrap changes now require explicit review before merge.

The practical effect: published installs use fully locked dependency graphs, closing the window where a transitive dependency could be swapped between the time a package is built and when you install it. This is solid supply chain hygiene, and it's the kind of thing that matters more as the ecosystem matures.

## Notable Fixes in Stable

A few fixes that weren't in the beta stand out:

**ACP session cleanup**: Child ACP sessions spawned via `sessions_spawn` now close when their parent session is reset or deleted. Previously, orphaned `claude-agent-acp` processes would accumulate and eventually exhaust memory — a real issue for long-running Gateway instances. ([#85190](https://github.com/openclaw/openclaw/pull/85190))

**Session write-lock enforcement**: The session write-lock max-hold policy is now enforced during acquisition, so long-held locks can be reclaimed before the stale-lock window expires. ([#85764](https://github.com/openclaw/openclaw/pull/85764))

**Stream error history**: Internal stream-error placeholder entries are now omitted from agent prompt history. Before this fix, failed assistant turns could be replayed as model-authored text, leading to confusing behavior on retry. ([#85652](https://github.com/openclaw/openclaw/pull/85652))

**Docker setup**: The Gateway bearer token is no longer printed in setup logs or follow-up commands. A small but meaningful security fix for anyone who runs OpenClaw in Docker.

**Memory/LanceDB**: Public memory artifacts — daily notes, dream reports, event logs, memory-wiki imports — are now exposed through the active memory provider bridge without depending on memory-core internals. ([#85060](https://github.com/openclaw/openclaw/pull/85060))

## How to Update

```bash
npm update -g openclaw
```

Or, if you're on a Git install:

```bash
openclaw update
```

The full changelog is on the [v2026.5.22 release page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.22). If you hit any issues after upgrading, `openclaw doctor` is the first stop — it handles config migration for the retired model refs and any other stale config patterns.
