---
title: "OpenClaw Cron Webhooks Survive Clock Jumps"
excerpt: "OpenClaw scheduled jobs now preserve webhook delivery after forward system-clock jumps, while genuine timeouts remain fenced."
coverImage: '/assets/images/posts/openclaw-2026-8-25-cron-webhook-clock-jump.png'
date: '2026-08-25T08:04:00.000Z'
dateFormatted: August 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-25-cron-webhook-clock-jump.png'
---

OpenClaw cron jobs got a useful reliability fix in [PR #129050](https://github.com/openclaw/openclaw/pull/129050): scheduled command jobs no longer silently lose webhook delivery when the system clock jumps forward while the command is still running.

This is the kind of bug that only shows up in real automation environments. Virtual machines resume from sleep. Hosts sync time. Cloud instances drift and correct. If a cron job is running during one of those jumps, wall-clock math can suddenly make a healthy in-progress command look like it has crossed a deadline.

For OpenClaw operators who use cron webhooks for notifications, downstream automation, or status delivery, that distinction matters.

## The Bug

The PR says the old behavior could drop scheduled command webhooks after a forward clock correction, even though the job's actual timeout had not expired. The cron watchdog already had an authoritative monotonic timeout, but the webhook path derived and forwarded a second wall-clock deadline.

That gave the system two clocks with different failure modes. The monotonic watchdog knew the job was still within its real timeout. The wall-clock deadline could incorrectly decide that webhook delivery was stale after a clock jump.

The result was quiet failure: no webhook callback, despite the command still being valid.

## The Fix

The merged change stops forwarding that extra wall-clock deadline for primary cron webhooks. The cron watchdog's monotonic timeout and abort signal stay authoritative.

The PR explicitly preserves the surrounding safety boundaries:

- True timeouts still fence delivery.
- Operator cancellation still prevents stale sends.
- Run-generation checks remain in place.
- SSRF fetch caps are retained.
- Explicit Gateway webhook deadlines remain separate.

That last point is important. This is not a loosening of timeout behavior. It is a removal of a second, less reliable deadline from the primary cron webhook path.

## Why Operators Should Care

Cron webhooks are often used as connective tissue: notify a Slack channel, kick an external workflow, record a completion, or trigger the next step in a lightweight pipeline. Silent drops are especially painful because the command itself may have run correctly while the signal disappeared.

After this fix, scheduled webhook notifications should continue normally after system-clock corrections, VM resumes, or similar forward jumps, as long as the real monotonic timeout has not elapsed.

## Evidence From The PR

The regression was reproduced with a real `CronService`, a real local HTTP server, a deferred command, a one-second monotonic watchdog, and a one-day wall-clock jump without advancing timers. Before the repair, the expected callback count was one and the observed count was zero.

After the fix, the same scenario delivered exactly one HTTP request. The PR also reports five focused owner and sibling suites passing, with 98 tests covering clock jumps, real webhook timeouts, operator cancellation, delivery lifecycle races, and the generic Gateway explicit-deadline contract.

For anyone leaning on OpenClaw cron for production-ish automation, this is a quiet but meaningful hardening patch.
