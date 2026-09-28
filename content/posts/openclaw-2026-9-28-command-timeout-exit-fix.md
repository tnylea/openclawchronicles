---
title: "OpenClaw Commands No Longer Time Out After Exit"
excerpt: "OpenClaw now reports the real result for commands that finish during event-loop lag instead of misclassifying them as timed out."
coverImage: '/assets/images/posts/openclaw-2026-9-28-command-timeout-exit-fix.png'
date: '2026-09-28T08:04:00.000Z'
dateFormatted: September 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-28-command-timeout-exit-fix.png'
---

OpenClaw merged a P1 availability fix Monday morning for a subtle but damaging process supervision bug: a command that already exited successfully could still be reported as timed out.

The change landed in [PR #159578](https://github.com/openclaw/openclaw/pull/159578), titled `fix(process): a finished command is reported as timed out when the event loop lags`. The PR says the failure could happen on a busy Gateway when an overdue deadline timer ran before Node delivered the queued exit notification.

## What Changed

OpenClaw runs a lot of subprocesses: Git commands, helper scripts, Crabbox jobs, build tools, test runners, and operator commands. Those commands already have deadline and process-tree handling so genuinely hung work can be killed and reported as timed out.

The bug was in the edge between real time and event-loop delivery. A subprocess could exit successfully before the timeout decision, but if the event loop was lagging, the timer callback might run first. The supervisor could then infer timeout from elapsed time alone and report exit 124 even though the process had already finished.

The fix changes that decision. A command that finishes and drains before the deadline decision runs is reported with its real result, even if the exit notification is delivered slightly after the nominal deadline because the event loop was busy.

Deadline, kill, grace, and settlement behavior remain in place for commands that actually hang.

## Why It Matters

False timeouts are more than noisy logs. In an agent runtime, a timeout can trigger retries, recovery paths, failed tasks, confusing transcripts, or unnecessary operator investigation.

The bad version of this bug is especially frustrating because the command did the right thing. It exited, produced output, and should have been recorded normally. The runtime then misclassified it because the supervisor observed timer delivery before exit delivery.

That kind of race is easy to miss until a busy system makes it visible. OpenClaw's Gateway often has many moving pieces: streaming sessions, background workers, database reads, browser activity, approvals, and command output all competing for scheduling.

## What Users Should Notice

Users should see fewer mysterious command failures where the reported timeout does not match the command's actual behavior. Short commands run by the Gateway should keep their real exit status and output when they finish before the timeout decision.

For operators, the important boundary is unchanged: genuinely stuck commands still time out, get their process tree killed, and settle through the existing timeout reporting path.

## Evidence From The PR

The PR frames this as an availability repair for busy Gateway conditions. It does not loosen command deadlines; it makes the supervisor account for a command that has already completed before deciding to call it timed out.

That is the right fix shape for process supervision. Timeouts should catch commands that are still running, not punish commands that finished while the event loop was catching its breath.
