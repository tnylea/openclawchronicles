---
title: "OpenClaw Bounds Queue Starvation Under Load"
excerpt: "OpenClaw PR #167683 prevents steady foreground traffic from indefinitely delaying background work while preserving existing queue limits."
coverImage: '/assets/images/posts/openclaw-2026-10-9-queue-starvation-fix.png'
date: '2026-10-09T08:01:00.000Z'
dateFormatted: October 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-9-queue-starvation-fix.png'
---

OpenClaw merged [PR #167683](https://github.com/openclaw/openclaw/pull/167683), a queue fairness fix for busy systems where foreground work can keep arriving faster than lower-priority work gets a chance to run.

The change targets a specific failure mode: continuous foreground arrivals could indefinitely postpone queued announcements and background work. Both the per-lane selector and shared-capacity arbiter previously used strict priority, so age did not eventually help an older queued item break through.

## What Changed

The new queue policy gives foreground work a head start, but not an unlimited one. According to the PR, foreground work retains a 15-second head start over normal work and a 30-second head start over background work. After that window, newer arrivals cannot keep overtaking older work forever.

That distinction matters. OpenClaw is not removing priority from the scheduler. A foreground task can still be favored when it first arrives, and running tasks are not preempted. The fix is about bounding overtaking so that older work eventually gets admitted under sustained load.

The implementation uses one comparator for FIFO lane heads and eligible capacity-group heads. It orders them by monotonic enqueue time plus the priority head start, then breaks ties by global enqueue sequence. The PR also removes duplicate arbitration policy and per-priority length counters.

## Why It Matters

Queue fairness is one of those runtime details that users usually notice only when it fails. A system can feel healthy during short bursts and still behave badly under a long stream of interactive work. Background announcements, scheduled work, and ordinary lower-priority tasks may look stuck even though the process is alive.

This PR narrows that gap. It keeps the existing concurrency and reservation model, preserves cancellation ownership, and avoids adding timers or promotion queues. The `queueAhead` value now represents the full enqueue-time backlog instead of a strict-priority rank that would become misleading once aging is involved.

For operators, the important takeaway is simple:

- Foreground work still gets first response.
- Background work is no longer starved indefinitely by constant arrivals.
- Running work is not interrupted.
- The queue contract is easier to reason about because the same comparator drives both lane and capacity-group ordering.

## The Measured Result

The PR includes a 60-second load rig through the actual queue API. In that rig, eight background announcements were queued at the start while foreground clients kept replenishing work. A second 64-job background burst arrived at 15 seconds.

The reported announcement wait p99 dropped from 60.097 seconds to 30.175 seconds. The 64-job background burst wait p99 dropped from 45.296 seconds to 30.216 seconds. Peak active tasks stayed at 32, while peak RSS and JavaScript heap were slightly lower in the candidate run.

Foreground wait stayed effectively unchanged across the full run, with p99 moving from 100.96 ms to 101.09 ms. During the burst window, foreground p99 rose to 300.70 ms, which is the expected tradeoff when aged backlog briefly takes admission precedence.

The PR is careful not to overclaim. The load rig used synthetic work through the real queue API, not production provider requests. It proves the scheduler behavior, not every possible overload scenario.

## Bottom Line

PR #167683 is a small runtime change with a large operational effect. It keeps OpenClaw responsive to foreground activity while preventing lower-priority work from being pushed back forever.

For high-traffic Gateways, that is the kind of fairness fix that makes scheduled jobs, announcements, and background maintenance feel less mysterious when the system is busy.
