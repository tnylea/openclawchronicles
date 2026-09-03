---
title: "OpenClaw Recovers Sessions From Dead Devices"
excerpt: "OpenClaw operators can now abandon unreachable paired-device placements, continue on Gateway, and redispatch stuck sessions safely."
coverImage: '/assets/images/posts/openclaw-2026-9-3-dead-device-recovery.png'
date: '2026-09-03T08:00:00.000Z'
dateFormatted: September 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-3-dead-device-recovery.png'
---

OpenClaw has merged a direct fix for sessions stranded on offline paired devices. PR [#137088](https://github.com/openclaw/openclaw/pull/137088), merged on September 3, repairs the recovery path for a worker placement whose paired device has gone away for good.

Before this change, the documented recovery actions could fail at the exact moment they were needed. The PR says **Continue on Gateway...** could return `device worker node is not connected with the supervisor dialect`, leave the placement failed, and then refuse a retry because the placement was no longer active. The admin fallback, forced `environments.destroy`, hit the same failure mode.

## What Changed

The repair carries an explicit `operator-abandon` stop reason from forced recovery paths through the provider lifecycle and tunnel. For device providers, that reason changes the behavior when the node is unreachable: after OpenClaw durably fences the placement, it tolerates the missing node, closes local transfer state, clears the lease, marks the environment failed with the forced-abandonment error, and completes the move back to local Gateway execution.

That is a narrow exception. Ordinary reclaim still waits for the device and reconciles normally. Connected devices still receive the remote stop. Cloud providers keep their physical teardown rules. The stale paired device is also fenced by the existing owner epoch if it ever reconnects.

The retry path is fixed too. A placement already fenced by a previous forced attempt can now retry at the RPC, source validator, durable move begin, and move barrier. Dispatch errors now name the device placement and point users at Continue on Gateway instead of describing the problem as a cloud worker stop.

## Recovery Steps

For operators, the high-level path is:

- Use **Continue on Gateway...** when a paired-device worker is gone
- Let OpenClaw abandon the unreachable device placement
- Confirm the session returns to local Gateway execution
- Redispatch once the stuck placement is cleared
- Use forced `environments.destroy` only as the admin last resort

Unsynced files on the unreachable device are still lost, exactly as the existing docs already warned. This PR is about making the documented recovery path actually complete when the device cannot answer.

## Why It Matters

Paired devices are useful precisely because they let work move closer to a user's hardware. But that also creates a failure mode: the hardware can vanish, sleep, break, lose network, or be retired while a session still believes it owns work there.

An unrecoverable placement is a bad operator experience because the user sees a stuck session but cannot perform the obvious repair. This change turns that dead end into a bounded abandonment flow with durable fencing and retry support.

## Verification

The PR reports a live replay against an exact stuck placement. On the pre-fix build, every recovery path failed. After restarting the same state directory on the repaired build, startup recovery completed the recorded abandonment, moved the placement local, marked the environment unavailable and destroyed, and accepted `sessions.dispatch` again.

Boundary tests cover the real SQLite store, placement service, environment lifecycle, node tunnel, forced-destroy RPC, and synthetic node transport. The focused run covered 17 files and 362 tests, with the changed-file gate green and Codex autoreview scoped-clean.

For OpenClaw users who rely on paired iPhones, iPads, Macs, or other nodes, this is a small but important operator recovery improvement.

---

*PR [#137088](https://github.com/openclaw/openclaw/pull/137088) · merged September 3, 2026 · source: OpenClaw GitHub*
