---
title: "OpenClaw 2026.9.1 Beta Ships Gateway Recovery"
excerpt: "OpenClaw 2026.9.1 beta focuses on Gateway restart recovery, safer Linux installs, worker cleanup, model browsing, and Control UI file safety."
coverImage: '/assets/images/posts/openclaw-2026-8-28-v2026-9-1-beta-gateway-recovery.png'
date: '2026-08-28T23:00:00.000Z'
dateFormatted: August 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-28-v2026-9-1-beta-gateway-recovery.png'
---

OpenClaw has published [v2026.9.1-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.9.1-beta.1), a reliability-heavy beta that landed at 20:43 UTC on August 28th. The release is less about a single flashy surface and more about keeping long-running agent work alive when the host, Gateway, installer, or UI is under pressure.

That matters because OpenClaw is increasingly used as an operating layer for persistent agents. A restart, worker crash, installer mismatch, or stale provider catalog can turn an otherwise successful run into an operator cleanup task. This beta tightens several of those paths.

## Gateway Recovery Leads The Release

The headline fix is Gateway restart recovery. The release notes say admitted restart-safe turns are preserved across repeated Gateway restarts, including checkpoints and final response delivery. In practical terms, a run that already crossed the admission boundary should be much less likely to disappear during a restart sequence.

The related config-write work addresses another edge around reload timing. Config writes now remain pending through watcher handoff so a same-write reload can settle against the observed generation instead of failing during source transfer. That is the kind of fix operators usually notice only when it is missing: a configuration change looks committed, then the reload path races it.

## Runtime And Installer Changes

The beta also updates the bundled Codex managed runtime to 0.150.1 across Linux, macOS, and Windows. The release frames that as a compatibility update for collaboration, status, and activity protocol additions while preserving platform-specific package resolution and existing compaction behavior.

Linux installation gets a separate reliability pass. Fresh installs now provision the stable Node 24 LTS stream and constrain RPM installs to the configured NodeSource repository. The release specifically calls out the goal: preventing Linux setup from selecting an incompatible prerelease.

## Worker And UI Reliability

OpenClaw 2026.9.1 beta also re-arms eligible worker launches after admission deadlines, terminalizes dead-worker turns, and defers cleanup debris so interrupted delegated work settles visibly. That is a meaningful operator-facing change because unresolved delegated work is one of the hardest failure modes to reason about after the fact.

Two UI-facing fixes round out the release. Control UI agent-file saves are protected from older reads and list refreshes that finish later, which should preserve confirmed saves and file metadata during overlapping activity. Model browsing is also kept available after automatic provider-plugin activation, preventing the selected catalog from disappearing just when a user is trying to choose a model.

## Why This Beta Matters

This release is a good snapshot of where OpenClaw hardening is focused late in the 2026.9 cycle:

- Restart-safe runs should survive repeated Gateway restarts.
- Config writes should settle against the generation that actually reached disk.
- Linux installs should stay on stable Node 24 rather than incompatible prereleases.
- Worker failures should become visible terminal states instead of lingering ambiguity.
- Control UI file saves and model browsing should remain stable under refresh and activation races.

The release notes also include audit-decision diagnostics, per-profile appearance preferences, and configurable model-selection scopes. None of those are as central as restart recovery, but together they show a beta aimed at making agent operations easier to inspect and harder to accidentally derail.

For teams running OpenClaw in production-like environments, v2026.9.1-beta.1 is worth reading closely before adoption. The most important changes sit at the boundaries where agent work crosses restarts, installers, worker ownership, and provider discovery.
