---
title: "OpenClaw Gateway Stops Now Wait For Work"
excerpt: "OpenClaw Gateway shutdown now waits for active agent and channel work, reducing the risk of truncating accepted embedded runs."
coverImage: '/assets/images/posts/openclaw-2026-8-18-gateway-active-work-shutdown.png'
date: '2026-08-18T23:02:00.000Z'
dateFormatted: August 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-18-gateway-active-work-shutdown.png'
---

OpenClaw merged a Gateway availability fix in [PR #126024](https://github.com/openclaw/openclaw/pull/126024), changing direct Gateway stops so they wait for active work before teardown.

The bug affected intent-free `SIGTERM` and `SIGINT` shutdowns. According to the PR, those paths drained only Gateway root work. A channel-adopted embedded run with no remaining root could therefore be cut off during server close.

For operators, this is the sort of reliability repair that matters most during restarts, deploys, and maintenance windows. An accepted channel event should not disappear just because the process is stopping through an ordinary system signal.

## What Changed

The fix adds one canonical active-work waiter that covers queue, reply, embedded, background-exec, cron, task, root, and session owners. OpenClaw now uses that waiter for both stop and restart under a single deadline.

The PR also deletes the older partial wait APIs. That is a meaningful design choice: instead of separate shutdown paths each remembering part of the system, shutdown now asks one shared owner for the complete active-work inventory.

Restart-only recovery and abort policy remain unchanged. The separate launchd and systemd timeout-budget mismatch is explicitly called out as out of scope and tracked separately.

## Why It Matters

Gateway shutdown is a coordination problem. OpenClaw may have queue work, embedded agent runs, channel replies, background commands, tasks, cron jobs, and session-owned turns all moving at once.

If a stop sequence only waits for root work, it can miss useful work that has been adopted by another owner. The PR's pre-fix trace summarized the failure shape: an adopted embedded run was still active, but Gateway close happened before embedded completion.

That is especially important for channel-connected agents. From the user's point of view, a message was accepted and the agent started working. If shutdown truncates that work without a durable terminal result, the system feels unreliable even when the process exits cleanly.

## User Impact

Direct Gateway stops now wait for active agent and channel work before teardown, bounded by the existing shutdown deadlines. Forced restart behavior is unchanged.

The most visible improvement should be fewer truncated runs during ordinary stops and restarts. Operators do not need a new setting to benefit once they are running a build that includes the merged PR.

## Evidence From The PR

The PR reports a pre-fix real OS signal trace where an adopted embedded run was still active when Gateway close occurred. The new process test proves embedded completion now precedes Gateway close.

Validation included 10 focused Vitest shards with 801 passing tests, 20 focused repetitions, the exact CI group `core-runtime-media-ui-2` with 2,742 passing tests, `node scripts/check-changed.mjs`, `pnpm build`, `git diff --check`, and a clean autoreview.

The author notes that no live production proof is claimed; the evidence is local process, test, check, and build proof. For a shutdown-lifecycle repair, that is still a strong fit for the failure mode described.
