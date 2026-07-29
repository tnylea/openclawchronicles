---
title: "OpenClaw Caps Stuck Channel Restart Loops"
excerpt: "OpenClaw hardened its Gateway health monitor so stuck channels respect restart budgets and reach a visible give-up state instead of thrashing."
coverImage: '/assets/images/posts/openclaw-channel-restart-budget-fix.png'
date: '2026-07-29T23:02:00.000Z'
dateFormatted: July 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-channel-restart-budget-fix.png'
---

OpenClaw merged a Gateway availability fix tonight that makes channel restart limits mean what they say. [PR #116089](https://github.com/openclaw/openclaw/pull/116089), titled `fix(gateway): cap channels stuck in pending restart`, fixes a loop where one unhealthy channel could restart on every health-monitor pass indefinitely.

The failure involved channels stuck in `restartPending` with `reconnectAttempts === 0`. In that state, the monitor treated each pass as a continuation of an existing pending restart. That branch intentionally skipped cooldown so a timed-out recovery could complete, but it also skipped the hourly restart budget and recorded nothing. The result was endless stop/start churn, noisy logs, and no reachable give-up state.

## The New Restart Rule

The PR keeps the important part of the old behavior: the first continuation after a timed-out recovery can still run immediately. That avoids stranding a legitimate recovery behind cooldown.

After that first free continuation, later passes while the account remains stuck rejoin both controls:

- The normal cooldown gate
- The configured `maxRestartsPerHour` budget
- The recorded restart history used to determine when to stop trying

The free continuation re-arms only after a real recovery, such as the account running again or `restartPending` clearing. A transient `reconnectAttempts` bump that falls back to zero no longer grants another free loop.

## Why Operators Should Care

Gateway channels are the connective tissue for Slack, Telegram, Signal, Discord, and other message surfaces. A restart loop is not just noisy. It can hide the actual failure state, consume resources, and make a channel look perpetually in motion while remaining unavailable.

The fix is labeled `P1` with `merge-risk: availability`, which fits the user impact. OpenClaw now preserves the quick recovery path for ordinary transient failures while preventing permanently stuck accounts from thrashing forever.

## Validation

The PR adds four regression tests to `src/gateway/channel-health-monitor.test.ts`, bringing that suite to 52 passing tests. The new coverage proves that a stuck channel stops after its budget is spent, that the first continuation still works even when `maxRestartsPerHour` is one, that transient reconnect-attempt changes do not re-arm the free pass, and that genuine recovery does re-arm it.

The author also reports local TypeScript, lint, formatting, and structured autoreview validation. There was no live Gateway run, but the added tests drive the real health-monitor loop with fake timers through the stuck-pending transitions.

For anyone running OpenClaw in production channels, this is a quality-of-life reliability patch: fewer infinite recovery loops, clearer terminal states, and restart budgets that stay enforceable under the failure mode they were meant to control.
