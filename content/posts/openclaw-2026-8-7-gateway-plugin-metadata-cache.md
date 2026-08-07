---
title: "OpenClaw Speeds Up Gateway Plugin Metadata"
excerpt: "OpenClaw PR #120344 reuses lifecycle plugin metadata, removing thousands of repeated scans that could freeze Gateway turns and session lists."
coverImage: '/assets/images/posts/openclaw-2026-8-7-gateway-plugin-metadata-cache.png'
date: '2026-08-07T23:03:00.000Z'
dateFormatted: August 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-7-gateway-plugin-metadata-cache.png'
---

OpenClaw merged [PR #120344, "perf(gateway): reuse lifecycle plugin metadata instead of per-turn rescans"](https://github.com/openclaw/openclaw/pull/120344), a P1 Gateway performance fix aimed at a surprisingly expensive runtime path.

The short version: Gateway already had a plugin metadata snapshot from startup, but some runtime readers were falling back to fresh synchronous plugin manifest scans. Under real test pressure, that turned into thousands of scans and long event-loop stalls.

For users, the visible symptom was a Gateway that could feel frozen during a turn, especially when session lists or TUI session switching happened while the agent was active.

## The Cost Of Repeated Scans

The PR reports one macOS TUI PTY end-to-end window where OpenClaw performed 2,285 `plugins.metadata.scan` events across 142 seconds. Those scans accounted for roughly 117 seconds of blocked event-loop time.

The distribution was telling: 1,246 scans happened during a single agent turn, 266 happened under `sessions.list`, and 677 occurred at startup. A mock-model chat turn spent 47 seconds inside Gateway dispatch, and `sessions.list` passed the 30-second Gateway client timeout.

Linux CI survived more often because filesystem metadata calls are faster there, but the wasted work existed across platforms.

## What Changed

The fix moves ownership back to the plugin metadata snapshot lifecycle. Gateway now publishes a complete lifecycle snapshot independently of the optional runtime lookup table, including startup and reload paths.

Runtime readers for provider auth, setup CLI backends, secret target registry, and trajectory capture can reuse the process-stable snapshot instead of forcing new synchronous scans. The doctor path also delegates to the shared snapshot completion helper rather than carrying a duplicate implementation.

Notably, the PR does not add a new cache, storage format, protocol surface, or environment option. It reuses the snapshot OpenClaw already had and prevents later code from accidentally clearing or bypassing it.

## User Impact

The measured improvement is dramatic. The same failing TUI scenario reportedly dropped from 141 seconds and timeout failure to an 18.8-second passing run. Post-fix diagnostics showed 30 metadata scans, all in startup phases, and zero scans during agent-turn, `sessions.list`, or history phases.

That should make active Gateway sessions feel less stuck. Session switching in the TUI or Control UI should answer promptly even while an agent turn is running.

## Validation

The PR reports focused plugin metadata snapshot tests, trajectory metadata tests, Gateway startup plugin tests, and wider Gateway reload and doctor suites passing. It also cites a passing mock QA lane and a clean autoreview with high confidence.

PR #120344 is a good example of performance work that matters operationally. No one installs an agent runtime to watch its plugin registry scan itself thousands of times. Reusing the lifecycle snapshot keeps Gateway attention on the live session where it belongs.
