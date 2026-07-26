---
title: "OpenClaw Keeps Queued Replies Alive Under Load"
excerpt: "OpenClaw now tracks global lane waits so queued user replies survive busy gateways instead of silently expiring behind long-running agent sessions under load."
coverImage: '/assets/images/posts/openclaw-2026-7-26-queued-reply-recovery.png'
date: '2026-07-26T08:01:00.000Z'
dateFormatted: July 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-26-queued-reply-recovery.png'
---

OpenClaw merged a P1 message-delivery fix for busy gateways where user replies could disappear while waiting behind long-running agent work. [PR #114058](https://github.com/openclaw/openclaw/pull/114058) changes how OpenClaw tracks queued replies, restart recovery, and stuck-session diagnostics when the global agent lane is saturated.

The issue was concrete: a user's "Continue" message could be accepted into the queue, sit behind several active Codex runs, and then expire as stale before it ever started. From the user's side, that looked like silence.

## The Failure Mode

Every agent turn holds a slot on the process-global `main` lane for its whole run. On a busy gateway, a reply for an otherwise idle session could queue behind those active runs. Its activity clock started before enqueueing, so after several minutes OpenClaw could kill it as a stale reply operation.

The PR cites production forensics from July 26th: replies waited more than 19 minutes on the lane, recovery fired repeatedly, and restarts could make the starvation worse by resuming interrupted runs at foreground priority.

## What Changed

OpenClaw now treats a global lane wait as an explicit wait phase. A queued reply enters `waiting_for_global_lane`, and reply staleness ignores that phase instead of counting it as inactivity.

The fix also changes recovery behavior:

- Restart-recovered sessions resume at background priority.
- Stuck-session recovery skips lane-waiting replies instead of repeatedly trying to recover them.
- Truly dropped replies now send an error instead of failing silently.
- Watchdog diagnostics use the same in-flight-adjusted backlog as the work snapshot.
- Orphaned handles without progress rows become reclaimable instead of looping forever.

Those changes tighten both the runtime behavior and the observability around it. The system can now distinguish "waiting for capacity" from "wedged and needs recovery."

## User Impact

The direct win is that a reply submitted during a busy period should start once capacity frees, instead of being silently killed while it waits. If OpenClaw genuinely cannot run the reply, the user should see a failure response rather than being left guessing.

This also makes restart behavior more respectful of live work. Recovery remains important, but it no longer jumps ahead of fresh user replies by default.

## Verification

The PR includes focused tests for reply-run registry behavior, diagnostic stuck-session recovery, stale recovery dispatch, and the agent runner lifecycle. The author reports the worker run covered 240 tests, with Linux CI treated as authoritative for one development-machine-only harness timeout.

For high-traffic OpenClaw gateways, this is one of those fixes that should be felt immediately: fewer vanished follow-ups, clearer error paths, and better recovery signals under pressure.
