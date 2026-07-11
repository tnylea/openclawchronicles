---
title: "OpenClaw Bounds Reply Hook Timeouts"
excerpt: "OpenClaw now prevents hung pre-delivery hooks from blocking reply lanes while preserving durable retry state for failed final messages."
coverImage: '/assets/images/posts/openclaw-2026-7-11-reply-hook-timeouts.png'
date: '2026-07-11T23:02:00.000Z'
dateFormatted: July 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-11-reply-hook-timeouts.png'
---

OpenClaw merged a P0 message-delivery fix Saturday to keep hung pre-delivery callbacks from blocking serialized reply lanes. [PR #104256](https://github.com/openclaw/openclaw/pull/104256) changes how reply dispatch handles `beforeDeliver` work across core, channel, and plugin-owned stages.

The bug was painful because it looked like partial success. A user could see reactions or other signs that the agent had worked, but the final answer never arrived. Worse, later replies could pile up behind the same stuck lane.

## The Failure Mode

OpenClaw routes replies through pre-delivery stages before transport. Those stages can be owned by constructors, channel-specific custom logic, post-construction appenders, or plugin hooks. If one of those callbacks never settled, the lane could stay occupied indefinitely.

The original report came from WhatsApp on 2026.6.11, but the PR intentionally fixes the broader production shape rather than only one suspected channel callback. That is the right scope for a P0 delivery bug: once the lane contract is vulnerable, every channel that uses the same dispatcher pattern deserves protection.

## The New Deadline Policy

Constructor, channel-custom, and post-construction stages now each get their own 15-second settlement deadline. The PR is careful about this distinction: two slow but valid stages do not share one aggregate deadline, and appended work cannot escape the timeout policy by landing later in the flattened stage list.

Plugin hook behavior keeps the existing 15-second default and fail-open approach, while explicit plugin or operator timeout overrides still win. Channel-plugin owners also get a public SDK path for declaring a positive finite budget through `beforeDeliverOptions: { timeoutMs }` or `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.

That gives normal plugins a bounded default without trapping legitimate slow work in a hard-coded ceiling.

## Delivery State Stays Honest

The PR does more than add timers. A timeout is recorded as `failed-before-deliver`, not as a deliberate cancellation. Per-payload completion preserves `pendingFinalDelivery` when every relevant final failed before transport started.

That matters for durable delivery semantics. OpenClaw should not mark a final reply as delivered when it never reached the channel transport. But it also should not blindly retry a payload after transport may already have started. The merged behavior keeps that line intact.

## Why This Is A Big Reliability Fix

Reply lanes are one of the most visible parts of an agent runtime. Users can tolerate a slow answer; they usually cannot diagnose a silent lane blockage from chat. By bounding pre-delivery work, OpenClaw makes the failure finite and lets later replies continue.

The validation covered never-settling hooks, explicit 20-second declared budgets, multiple independent slow stages, plugin hook timeout overrides, pending-state transitions, enqueue-then-append timing, and the public Plugin SDK contract. The installed-runtime proof showed the first unresolved final timing out after roughly 15 seconds and the same dispatcher successfully delivering a follow-up final afterward.
