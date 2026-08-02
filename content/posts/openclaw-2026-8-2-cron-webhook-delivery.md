---
title: "OpenClaw Records Cron Webhook Delivery Outcomes"
excerpt: "OpenClaw PR #117783 moves cron webhook delivery into the tracked run lifecycle so success, failure, timeout, and cancellation are recorded."
coverImage: '/assets/images/posts/openclaw-2026-8-2-cron-webhook-delivery.png'
date: '2026-08-02T08:02:00.000Z'
dateFormatted: August 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-2-cron-webhook-delivery.png'
---

OpenClaw merged a major cron reliability fix this morning with [PR #117783, "fix(cron): deliver and record primary webhook outcomes"](https://github.com/openclaw/openclaw/pull/117783). The patch addresses a nasty automation failure mode: a job configured with `--webhook` could complete successfully, produce a payload, deliver nothing, and still leave run history with `deliveryStatus: "unknown"`.

That is a dangerous state for automation. A cron run is only as useful as its delivery record. If a command job says it succeeded but its primary webhook never fired, operators need to see that as a delivery failure, not as an ambiguous historical detail.

The PR says the bug was reproduced on a production team host. A command job fired twice, both runs completed with `status: ok`, the payload appeared in `summary`, no POSTs were observed, and delivery was recorded as `unknown`. Both command jobs and isolated agent jobs were affected.

## What Changed

The root issue was split ownership. Command execution handled announce delivery, but webhook mode returned as undelivered. Cron then finalized state and history before a detached Gateway path attempted webhook delivery later. If that detached delivery failed, the error was logged and swallowed after the run record was already sealed.

The fix moves primary webhook delivery into the cron run's tracked lifetime. That means delivery now shares the run's abort controller and watchdog deadline, and the result is published before the delivery promise resolves.

OpenClaw now records concrete outcomes:

- `delivered` when the webhook POST succeeds
- `not-delivered` when HTTP, timeout, invalid-target, secret-owner, or SSRF failures occur
- a specific `deliveryError` when delivery fails
- not-requested status when a trigger intentionally evaluates false

The existing private-address SSRF guard is unchanged. The improvement is that an SSRF-blocked webhook now produces an honest recorded failure instead of disappearing into `unknown`.

## Why It Matters

Cron jobs are often used for scheduled reports, monitoring pings, deploy hooks, backups, and one-shot reminders. A job can do perfect work and still be operationally broken if its result never reaches the target system.

By pulling webhook delivery into the run lifecycle, OpenClaw makes the delivery leg auditable. A hanging endpoint finalizes at the configured deadline as not delivered. Operator cancellation interrupts an in-flight send. A POST already accepted by the endpoint cannot be overwritten by a late cancellation.

The retry policy also becomes cleaner. Transient errors retry only when OpenClaw can prove the webhook was unsent, using the existing 5, 10, and 20 second backoff. HTTP and SSRF failures do not retry.

## Evidence

The PR includes real-HTTP regressions for success, HTTP 503, hanging endpoints, cancellation during a hang, accepted-POST-then-cancel races, false trigger evaluation, and isolated-agent webhook delivery. The broad cron suite passed 1,934 tests across 160 files, with 113 Gateway webhook and cron tests passing and 69 of 69 timeout/watchdog regressions passing.

No announce or channel behavior changed, and the patch does not add a new config surface or schema. The primary change is ownership: webhook delivery is now part of the cron run OpenClaw records.
