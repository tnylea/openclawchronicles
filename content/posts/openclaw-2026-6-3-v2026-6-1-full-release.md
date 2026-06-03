---
title: "OpenClaw v2026.6.1: Skill Workshop, Official Plugins, and Workboard"
excerpt: "OpenClaw v2026.6.1 ships Skill Workshop with full proposal reviews, official Tokenjuice and Copilot plugins, Workboard for multi-agent orchestration, and iPad support."
coverImage: '/assets/images/posts/openclaw-2026-6-3-v2026-6-1-full-release.png'
date: '2026-06-03T23:05:00.000Z'
dateFormatted: June 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-3-v2026-6-1-full-release.png'
---

OpenClaw pushed its first stable release of the v2026.6.1 cycle tonight, and it is one of the meatier drops in recent months. The full release landed at 19:35 UTC on June 3rd after three beta iterations, and it touches nearly every layer of the stack — from how skills get created and reviewed to how channel messages survive a restart.

## Skill Workshop: A Full Governed Lifecycle for Skills

The headliner is Skill Workshop. Rather than skills being dropped straight into production by whoever has write access, the new system formalizes a proposal → review → approve/reject → rollback pipeline. Operators can review proposals through a new Control UI tab, a CLI command, or the Gateway. Each proposal carries versioned frontmatter, supports file attachments with scanner and hash verification, and maintains a rollback snapshot if anything goes wrong after approval.

The `skill_workshop` agent tool is now exposed so agents themselves can submit, revise, and apply proposals through the guarded flow. This is a meaningful step toward letting AI systems manage their own skill lifecycle under human oversight rather than bypassing it entirely. The [dedicated Skill Workshop guide](https://github.com/openclaw/openclaw/pull/88734) landed simultaneously.

## Tokenjuice and Copilot Are Now Official Plugins

Two previously bundled capabilities have been externalized as first-class plugins:

- **@openclaw/tokenjuice** — the token optimization layer, now available independently via npm and ClawHub
- **@openclaw/copilot** — the GitHub Copilot agent runtime, now a standalone plugin with its own ClawHub listing

Externalizing these means users who don't need them stop paying the load cost, and each plugin can ship updates on its own cadence without waiting for a core release.

## Workboard: Orchestration Primitives for Multi-Agent Work

Workboard got a meaningful upgrade with orchestration primitives and agent coordination tools for multi-agent planning and run tracking. Task-backed board runs are now wired up, and task comments appear in the edit modal. This is early infrastructure for coordinating multiple agents across longer-horizon work — worth watching as it matures.

## What Else Shipped

**iOS and iPad:** Native iPad display layouts are in, and the iOS push relay defaults are now hosted. Realtime Talk now works on mobile with a guarded WebSocket ping path to keep sessions alive.

**MiniMax M3:** The new model from MiniMax is now available as an OpenClaw provider.

**SQLite-backed state:** Channel inbound queues, iMessage monitor state, and the plugin install index all moved to SQLite. This means restarts and local monitors recover cleanly with far less duplicate filesystem scanning — a real quality-of-life improvement for anyone running OpenClaw on flaky or frequently rebooting hardware.

**Code mode namespaces:** Code mode adds internal namespaces for scoped agent and global sessions, with exact namespace tool dispatch and new MCP API files for code-mode integrations.

**Auth hardening:** Auth profiles are now written atomically, auth failures dispatch by type, and a force re-login recovery path was added. Compaction happens before oversized turns to keep recovery paths from hitting partial state.

**Doctor disk checks:** The `doctor` command now catches low-disk conditions before Crabbox sparse-sync checkouts fail partway through.

**Control UI:** The Dreaming tab gains an agent selector that propagates through diary and status views. Composer controls are calmer, drafts stay local while typing, and first-output latency is now instrumented.

## Upgrade

Update with:

```bash
openclaw update
```

The full changelog is on [GitHub Releases](https://github.com/openclaw/openclaw/releases/tag/v2026.6.1). Skill Workshop documentation is at [docs.openclaw.ai](https://docs.openclaw.ai).
