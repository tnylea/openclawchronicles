---
title: "OpenClaw Marks Partial Subagent Delivery"
excerpt: "OpenClaw PR #159185 records partial subagent direct-message delivery as incomplete instead of silently treating the first delivered chunk as success."
coverImage: '/assets/images/posts/openclaw-2026-9-26-subagent-incomplete-delivery.png'
date: '2026-09-26T23:02:00.000Z'
dateFormatted: September 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-26-subagent-incomplete-delivery.png'
---

OpenClaw merged [PR #159185](https://github.com/openclaw/openclaw/pull/159185), a high-priority message-delivery fix for subagent completion announcements sent through direct-message text fallback.

The bug was small in shape and serious in consequence. When a subagent result was too long for one message, OpenClaw split it into chunks. If the first chunk went out but a later chunk failed or was aborted, OpenClaw could still record the completion as delivered. The registry cleared pending delivery, while the recipient received only a truncated result.

The new behavior is more honest: partial delivery is recorded as incomplete with the relevant error instead of silently becoming success.

## What Changed

The root problem lived in `deliverCompletionDirect`. The old path committed success from a per-chunk delivery-result callback. That meant the first chunk's receipt could stand in for the whole payload.

The fix moves success settlement to the outbound pipeline's existing per-payload observer, `onDeliveredPayload`, which fires only after the payload's sends are recorded. In other words, OpenClaw now marks the announcement delivered only when every chunk has gone out.

If an earlier chunk was sent and a later chunk fails, delivery is recorded as a terminal, incomplete `permanent_failure` with the error. That is intentionally not retried automatically, because retrying could resend chunks the recipient already has.

The PR also preserves a useful existing behavior: if the full result was sent successfully, it can remain delivered even if later transcript mirroring or bookkeeping fails. A successful child's result also remains available for recovery.

## Why It Matters

Subagents are only useful if their completion state matches reality. A requester needs to know whether a result arrived, whether it is still pending, or whether something went wrong.

The old behavior created a particularly awkward failure mode:

- A long completion result was chunked.
- The first direct-message chunk succeeded.
- A later chunk failed or was aborted.
- The registry recorded delivery as complete.
- The human saw a partial result with no reliable signal that the rest was missing.

That is worse than a visible failure because it looks done. PR #159185 closes that gap by treating partial sends as incomplete delivery, preserving the error for the operator and requester.

## Evidence Behind The Merge

The PR carried `P1`, `agents`, and `merge-risk: message-delivery` labels. The implementation is modest in size: 21 production lines added and four removed, with tests and docs updated around the delivery contract.

The new regression tests cover rejected and aborted second chunks. On `main`, those cases incorrectly returned `delivered: true`; with the fix, they pass and show no automatic replay.

On Blacksmith Testbox via Crabbox, 323 tests passed across the announce text-delivery, delivery, completion-delivery, direct-delivery, dispatch, and registry-cleanup suites. The changed-check script also passed, and independent review reported no actionable issue.

## The Bottom Line

This is a good example of OpenClaw tightening its accounting around distributed work. Message delivery is not just "did any bytes leave the system?" It is whether the intended payload reached the recipient well enough to count as complete.

With PR #159185, partial subagent completion delivery becomes visible, terminal, and recoverable instead of being mistaken for success.
