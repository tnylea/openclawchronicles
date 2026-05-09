---
title: "OpenClaw Fixes Long Codex Sessions Losing Tool Access"
excerpt: "Two reliability fixes merged May 9 address Codex native hook relay expiry in long turns and false gateway health degradation warnings."
coverImage: '/assets/images/posts/openclaw-2026-5-9-codex-relay-fix.png'
date: '2026-05-09T08:00:00.000Z'
dateFormatted: May 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-9-codex-relay-fix.png'
---

If you've ever kicked off a long OpenClaw Codex session — a 45-minute refactor, a multi-file audit, a big scaffolding job — and noticed it mysteriously failing to execute shell commands partway through, today's merge has your answer.

Two reliability-focused pull requests from contributor **rubencu** landed in the OpenClaw main branch on May 9th, 2026, patching a pair of bugs that were quietly degrading long-running agent sessions and Gateway health reporting.

## The Codex Relay TTL Bug (PR #77533)

The bigger of the two fixes targets a hard-coded 30-minute cap on the **native hook relay** used by Codex to authorize tool calls like `shell` and `apply_patch`.

Here's what was happening: when a Codex turn runs longer than 30 minutes, OpenClaw's `PreToolUse` hook — which is responsible for approving or denying each tool execution — would reach for the native hook relay and find it gone. The relay expired on a fixed 30-minute TTL that had nothing to do with how long the actual Codex run was configured to last. The result: `Native hook relay unavailable`, and tool calls start failing closed. Your agent kept running, but it couldn't actually *do* anything.

The fix is clean: instead of hardcoding 30 minutes, the relay TTL is now **derived from the actual run configuration** — startup wait + turn start wait + active run timeout + 5 minutes of cleanup grace — with the old 30-minute value kept as a floor. For a typical `--timeout 2700` (45-minute) Codex run, the relay now lives for roughly 140 minutes instead of 30.

From the PR's live proof output before the fix:

```json
{
  "ttlFromStartMs": 1811993,
  "ttlFromStartMinutes": "30.20",
  "remainingMs": 1796942
}
```

And after:

```json
{
  "ttlFromStartMs": 8410299,
  "ttlFromStartMinutes": "140.17",
  "remainingMs": 8395230
}
```

No new config surface is introduced. Explicit `ttlMs` overrides are preserved. And the relay still unregisters cleanly when the run finishes, so there's no resource leak.

This was a particularly tricky regression to catch because everything *looks* fine until you exceed the 30-minute mark — and most casual Codex sessions never do. Heavy users running large codebases were the ones hitting it consistently.

## False Gateway Health Warnings (PR #77028)

The second fix, also from rubencu, addresses a related nuisance: the Gateway was sometimes reporting its event loop as **degraded** based on CPU utilization and loop delay metrics sampled too early — before it had accumulated a meaningful baseline.

The result was false-positive health warnings during startup or after a quick restart. Users checking `openclaw gateway status` or watching health probes would see degraded signals despite the Gateway running perfectly fine.

The fix ensures the Gateway waits for a **sustained sampling window** before flagging event-loop degradation from CPU/utilization metrics alone. Hot startup spikes no longer immediately pollute the health status.

## Why These PRs Matter

Both fixes target the same class of problem: **assumptions baked in as constants that break under real-world heavy usage**. A 30-minute relay floor made sense as a quick default; it became a silent failure mode for anyone doing serious agentic work. A startup health check made sense for catching real degradation; it became noisy false alarms for anyone monitoring their Gateway closely.

Neither change requires config updates or restarts beyond a normal `openclaw update`. If you've been working around long-Codex-turn failures by breaking your work into sub-30-minute chunks — you can stop doing that.

Both PRs were reviewed with the Codex harness against live runs before merge, and the relay fix includes a focused regression test covering the 45-minute turn case.

## How to Update

```bash
openclaw update
```

Both fixes will be included in the next point release. You can also track their status in the [OpenClaw changelog on GitHub](https://github.com/openclaw/openclaw/releases).
