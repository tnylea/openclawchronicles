---
title: "OpenClaw Cron Jobs Get Faster Failover"
excerpt: "OpenClaw now fails over stalled cron model streams before the outer job timeout, improving scheduled automation reliability."
coverImage: '/assets/images/posts/openclaw-2026-6-25-cron-stream-failover.png'
date: '2026-06-25T23:01:00.000Z'
dateFormatted: June 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-25-cron-stream-failover.png'
---

OpenClaw merged [PR #96096, "fix: cron stream stalls fail over before job timeout"](https://github.com/openclaw/openclaw/pull/96096), a P1 reliability fix for scheduled jobs that depend on cloud model fallback.

The problem was specific but painful. A cron job could start a pinned cloud model, open a stream, and then receive no chunks. Because the stream was technically open, the job could wait until the outer cron timeout instead of quickly moving to the next configured model in the fallback chain.

For operators, that means one stalled provider candidate could consume the whole scheduled run window.

## What Changed

The PR caps explicit per-run stream idle waits for cron-triggered cloud model calls at 60 seconds. If a cloud model opens a stream but does not produce chunks, OpenClaw can now fail that candidate early enough for `runWithModelFallback` to try the next model before the entire job expires.

The scope is intentionally narrow. The PR body says local, private, and self-hosted hostname providers keep their previous explicit cron timeout behavior. That distinction matters because a local model may reasonably need a longer startup or generation window, while a remote cloud stream that stays idle is more likely to be an availability problem.

The change also preserves the job-level timeout. OpenClaw is not making cron jobs run forever in pursuit of a fallback. It is giving the fallback chain room to work inside the existing job boundary.

## Why It Matters

Cron is where OpenClaw stops being an interactive chat bot and starts acting like infrastructure. Nightly summaries, inbox checks, report generation, watchdog tasks, and channel notifications all depend on scheduled runs finishing predictably.

When a stream stalls silently, users may not see an error until much later, or they may only see that the automation never produced its expected output. A faster failover path turns a provider hiccup into a recoverable model selection event.

That is especially useful for operators who configure paid cloud models with secondary providers. Fallback only helps if the runtime reaches it before the cron job is already out of time.

## Validation

The PR carries broad channel and extension labels because cron output can flow through many delivery surfaces. It also includes `P1`, `merge-risk: availability`, and `proof: sufficient`, signaling that the fix was treated as an operational reliability issue rather than a cosmetic timeout tweak.

The user-facing outcome is straightforward: scheduled OpenClaw jobs should no longer burn the whole run on a cloud stream that opens and then goes quiet. They should fail over sooner, preserve the cron job's delivery path, and make configured fallback models more useful in real automation.

