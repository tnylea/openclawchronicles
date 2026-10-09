---
title: "OpenClaw Calms Cron Alerts During Outages"
excerpt: "OpenClaw PR #167957 delays cron repair requests and alerts while provider-outage retries are still pending."
coverImage: '/assets/images/posts/openclaw-2026-10-9-cron-outage-alert-hold.png'
date: '2026-10-09T23:03:00.000Z'
dateFormatted: October 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-9-cron-outage-alert-hold.png'
---

OpenClaw merged [PR #167957](https://github.com/openclaw/openclaw/pull/167957), a cron reliability change that makes scheduled automations less noisy during short provider outages.

The issue was timing. A recurring automation that hit a temporary provider failure, such as DNS trouble, a refused connection, a 5xx response, overload, or a rate limit, could spend its owner repair request or send a failure alert while OpenClaw's own retry ladder was still pending. If the retry succeeded shortly after, the user had already been interrupted.

## What Changed

OpenClaw's cron outcome path now records when a transient provider failure still has a retry pending. That signal is passed into the failure-notification flow, which holds the repair request or alert for that cycle.

The hold is bounded. It lasts only while the transient retry budget remains, including the quick retry ladder and ordinary backoff when a short-interval job's next slot arrives first. The PR describes the quick retry cadence as 30 seconds, one minute, and five minutes.

The hold also has important exclusions. OpenClaw does not delay notifications when there is no next run, when a one-shot job is retired after retries, when a job is disabled, or when the failure is caused by the job itself. Cron watchdog timeouts, helper-script failures, script timeouts, and command-job timeouts keep their existing repair timing.

## Why It Matters

Automation alerts are useful only when they arrive at the right moment. Too early, and they train users to ignore noise. Too late, and they hide real breakage. This change is a pragmatic middle ground for provider outages: let the built-in retry plan breathe first, then ask for help if the failure persists.

For owners of scheduled OpenClaw jobs, the behavior should now be calmer:

- Short provider outages can recover silently.
- Repair requests are not spent while a retry is already queued.
- Failure alerts still arrive if the retry budget is exhausted.
- Job-owned failures are still surfaced promptly.
- No config key, schema migration, or stored-state change is required.

This matters for any installation that depends on scheduled summaries, reminders, checks, or outbound updates. Provider blips happen; the automation system should not treat every transient network stumble as a durable broken job.

## Evidence From The PR

The PR reports unit coverage for owned, unowned, hourly, weekly, every-minute, disabled, one-shot, and no-future-slot cases. In the DNS-failure cases, owned and unowned jobs sent no repairs or alerts through failure three, then sent one repair or alert after failure four if the outage persisted.

The live proof used an isolated Gateway and a mock provider that dropped TCP connections for the job's model requests. On the fixed branch, an owned hourly job produced no owner repair or alert through the first three failures, then sent one repair after the fourth. On main, the same setup sent a repair after failure two and an alert after failure three.

## Bottom Line

PR #167957 makes OpenClaw cron jobs a little more patient in exactly the cases where patience helps. It does not hide permanent failures, and it does not soften job-caused failures. It simply waits for OpenClaw's own transient retry budget before waking the owner.

That should make automation alerts feel more like useful signals and less like turbulence reports.
