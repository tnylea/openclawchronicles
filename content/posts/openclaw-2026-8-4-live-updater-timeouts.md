---
title: "OpenClaw Bounds Live Updater Maintenance"
excerpt: "OpenClaw PR #119116 prevents stalled live-updater commands from keeping the Gateway fenced or offline indefinitely."
coverImage: '/assets/images/posts/openclaw-2026-8-4-live-updater-timeouts.png'
date: '2026-08-04T08:04:00.000Z'
dateFormatted: August 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-4-live-updater-timeouts.png'
---

OpenClaw merged [PR #119116, "fix: prevent live updater from leaving Gateway offline indefinitely"](https://github.com/openclaw/openclaw/pull/119116), a P1 availability fix for the live updater.

The problem was a dangerous maintenance gap. The updater could run external commands without hard wall-clock deadlines. If a dependency install, build, service action, Git operation, or probe stalled, OpenClaw could leave the Gateway fenced or stopped indefinitely. That could also block rollback, lock release, and the terminal JSON result operators need for automation.

The PR notes an August 3, 2026 fleet observation involving `pnpm install --frozen-lockfile` producing network retries and then remaining alive without visible progress. The merged fix does not blame pnpm. It treats the confirmed issue as OpenClaw's responsibility: the updater must bound and clean up child commands even when the external command misbehaves.

## Explicit Maintenance Budgets

The updater now applies fixed wall budgets to external phases:

- Git fetch: 5 minutes
- Git fast-forward merge: 2 minutes
- dependency install: 15 minutes
- Gateway build: 20 minutes
- service actions: 60 seconds
- Gateway probes: 30 seconds
- macOS rebuild: 30 minutes

Continuous output no longer extends those deadlines. That matters because retry logs or progress noise can otherwise make a stuck command look alive forever.

On macOS and Linux, the updater now runs commands in detached process groups. When a timeout hits, cleanup starts at the deadline and is bounded to five seconds. Settlement no longer depends on the child process emitting a normal `close` event.

## Fail-Closed Recovery

The most important behavior is what happens after service stop. If a stopped-state command tree is still live or indeterminate after bounded cleanup, OpenClaw fails closed. It does not restart the previous service alongside an uncontrolled updater child. Instead, it retains the maintenance lock against the exact process group and lets a later heartbeat reclaim that lock after the group is gone.

The terminal result becomes `command_cleanup_failed` with bounded, redacted diagnostics. The PR says timeout output can include safe phase, service-state, elapsed-time, timeout, cleanup-state, and lock-retention facts without exposing paths, argv, environment, stdout, stderr, or process identifiers.

Windows gets a stricter treatment for now. Because `taskkill /T` cannot verify descendants after the root exits, the updater refuses before spawning the pre-stop Git fetch in strict process-tree mode, leaves the Gateway untouched, releases the maintenance lock, and emits `unsupported_process_tree_verification`.

## Operator Impact

Normal installs and builds still get generous time budgets. The change is aimed at bounded recovery, not premature cancellation.

A timeout before service stop releases the lock without changing service state. A timeout after stop attempts exact child-tree cleanup before rollback. An unverified live tree produces a visible fail-closed result instead of creating concurrent mutation or waiting forever.

For anyone running unattended OpenClaw upgrades, that is the right tradeoff. The updater may still fail when the environment misbehaves, but it should fail with ownership, diagnostics, and a recovery path.

## Evidence

PR #119116 reports focused macOS proof with 96 passing tests across managed child process and live updater coverage. Linux Testbox proof reported 92 passing focused tests plus a changed-surface gate covering formatting, declaration contracts, all-project typecheck, full lint, policy guards, and runtime import-cycle checks.

The behavior coverage included silent children, active output without false timeout extension, descendant cleanup, missing `close`, transient indeterminate POSIX state, bounded Windows timeout cleanup, strict Windows refusal before spawn, pre-stop timeout, post-stop recovery, process-group lock retention, manual-recovery lock retention, normal under-budget builds, and a machine-readable result.

That makes this a major maintenance hardening change: OpenClaw's live updater now treats stalled external work as a bounded failure instead of an indefinite Gateway outage.
