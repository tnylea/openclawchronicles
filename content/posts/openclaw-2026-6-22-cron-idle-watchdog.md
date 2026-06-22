---
title: "OpenClaw Keeps Cron Idle Watchdogs Enabled"
excerpt: "OpenClaw fixes cron-triggered embedded agent runs so silent remote model calls keep the default idle watchdog unless explicitly configured otherwise."
coverImage: '/assets/images/posts/openclaw-2026-6-22-cron-idle-watchdog.png'
date: '2026-06-22T23:01:00.000Z'
dateFormatted: June 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-22-cron-idle-watchdog.png'
---

OpenClaw merged a P1 reliability fix in [PR #94445](https://github.com/openclaw/openclaw/pull/94445) that keeps the default LLM idle watchdog enabled for cron-triggered embedded agent runs when no explicit timeout is configured.

The issue was easy to miss because cron runs are supposed to be quiet, isolated, and durable. But quiet should not mean stuck. The PR targets a reported installed-runtime incident where an isolated `agent:main:cron:*` Codex run stayed in `activeWorkKind=model_call` with queued work and no recovery because cron had disabled the implicit model-idle fuse.

## Why This Matters

Cron is one of OpenClaw's most important automation surfaces. It is where users put scheduled checks, nightly aggregation jobs, reminders, reporting loops, and background agent work that should run without someone watching a terminal.

That also makes cron a bad place for a silent model call to wedge indefinitely. If a remote provider stops producing useful progress and the run has no explicit timeout, OpenClaw needs a default recovery path. Without it, queued work can remain attached to a session that looks active but is not meaningfully moving.

The fix restores that default behavior for remote model calls while preserving the existing timeout precedence:

- An explicit run timeout still wins.
- A provider request timeout still wins.
- `agents.defaults.timeoutSeconds` still wins.
- Local-provider opt-outs remain available for long local model evaluation.

That last point is important. The PR does not collapse every model path into one aggressive timeout. Local providers can still spend longer evaluating prompts without being treated like a silent remote API call.

## A Narrow Runtime Fix

The pull request is intentionally scoped. It does not change lane scheduling, queued-work diagnostics, recovery policy, fallback policy, or the configured timeout model. It changes the idle-timeout resolver and stream guard so cron-triggered Codex or remote-model runs share the same default silence guard as other embedded runs unless configuration says otherwise.

The linked proof is practical rather than theoretical. The author inspected sanitized installed-runtime diagnostics from the reported node, confirmed there was no configured timeout on the affected surfaces, then ran production-code harnesses and focused regression tests for the incident-shaped route.

That is the right kind of fix for infrastructure code. It preserves the operator's configured overrides, keeps the local-model exception narrow, and adds tests for both cron no-timeout behavior and cron local-provider behavior.

## What Operators Should Expect

For users running scheduled OpenClaw jobs against hosted models, the intended outcome is simple: a silent remote model call should no longer leave a cron session active forever just because the cron path lacked an explicit timeout.

This pairs well with the recent cron delivery and target-session work. OpenClaw has been steadily tightening scheduled-agent semantics: which session receives a result, how the transcript stays attached, and now how a silent model call gets recovered before a job sits wedged.

Cron jobs are only useful when they are boring in production. PR #94445 is a small but meaningful step toward that kind of boring: scheduled OpenClaw runs should finish, fail, or recover instead of silently occupying a lane.
