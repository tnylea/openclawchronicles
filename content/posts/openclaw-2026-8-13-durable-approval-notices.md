---
title: "OpenClaw Makes Approval-Unavailable Replies Durable"
excerpt: "OpenClaw now routes approval-unavailable notices through durable tool-result delivery so users receive recovery guidance reliably."
coverImage: '/assets/images/posts/openclaw-2026-8-13-durable-approval-notices.png'
date: '2026-08-13T08:06:00.000Z'
dateFormatted: August 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-13-durable-approval-notices.png'
---

OpenClaw merged a message-delivery fix for one of the most frustrating failure modes in agent workflows: asking for a command approval when the current channel cannot actually present the approval flow. [PR #121179](https://github.com/openclaw/openclaw/pull/121179), titled "fix(replies): keep approval-unavailable notices durable," makes sure the user still receives the explanation and recovery guidance.

The bug sat at the intersection of exec approvals, channel progress callbacks, and quiet tool-summary behavior. When a command could not enter the interactive approval flow, OpenClaw could generate an actionable unavailable notice. But if transient progress delivery was active, that notice could be routed like a progress update rather than durable user-facing output.

In practice, that could leave the user with no clear explanation of why the approval did not appear or what to do next.

## What Changed

The fix adds a typed channel-data marker to approval-unavailable replies on both builder return paths. OpenClaw's shared delivery classifier already understands that marker, so the notice can bypass transient progress callbacks and route through durable tool-result delivery instead.

The PR also updates the quiet direct resolver so it preserves the same marker next to pending approvals. That matters for verbose-off or quiet flows, where OpenClaw is intentionally reducing ordinary tool chatter but still needs to deliver important recovery guidance.

The result is a cleaner rule: unavailable approval notices are not ordinary progress. They are durable user-facing messages.

## Why This Is A Reliability Fix

Approvals are a trust boundary. If the agent needs permission and the current channel cannot provide it, the right product behavior is not silence. The user should see a clear notice explaining that the approval route is unavailable and what action can recover the workflow.

This PR covers direct, queued, and non-forced quiet flows. It keeps ordinary progress messages unchanged while giving approval-unavailable notices a stronger delivery path.

That narrowness is important. The fix does not make approval policy looser. It does not auto-approve work. It simply keeps the refusal or recovery message from being lost in a transient delivery path.

## Evidence From The PR

The PR added builder regressions for both unavailable reasons and both payload return shapes. It also added direct and queued dispatcher-policy regressions proving the marker bypasses transient callbacks, plus a non-forced verbose-off direct-dispatch regression proving the quiet resolver reaches durable `sendToolResult` delivery.

The final exact-head proof covered producer, direct-dispatch, and queued follow-up tests. The PR also includes a focused runtime transcript showing one inbound event, one provider call, and one durable QA channel API send through the production classifier path.

## Why Operators Should Care

OpenClaw is increasingly used across many channels: Slack, Telegram, Discord, WhatsApp, Signal, and others. Not every channel or context can carry the same interactive approval experience. Durable failure messages are what keep those differences understandable instead of mysterious.

For operators, this should mean fewer dead-end exec attempts. For agent builders, it tightens the distinction between optional progress and required recovery communication.

## The Bottom Line

[PR #121179](https://github.com/openclaw/openclaw/pull/121179) is a small but meaningful message-delivery hardening patch. When an exec approval route is unavailable, OpenClaw should now reliably tell the user instead of letting the guidance vanish behind transient progress handling.
