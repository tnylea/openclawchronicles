---
title: "OpenClaw Fixes Agent Sends Broken by Tool Schema Padding"
excerpt: "PR #89601 patches a subtle bug where AI models echoing default poll parameters caused ordinary send calls to fail with a misleading poll-intent error."
coverImage: '/assets/images/posts/openclaw-2026-6-3-poll-schema-send-fix.webp'
date: '2026-06-03T08:00:00.000Z'
dateFormatted: June 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-3-poll-schema-send-fix.webp'
---

## The Bug in Brief

Imagine your OpenClaw agent tries to send a normal message in a Telegram or Discord channel and instead gets this error:

```
Poll fields require action "poll"; use action "poll" instead of "send".
```

Nothing about your message was a poll. Your agent was summarizing a GitHub issue, and instead of a reply, the whole turn died with a confusing schema error. This was exactly the problem [PR #89601](https://github.com/openclaw/openclaw/pull/89601), contributed by @codezz (Gabriel Fratica) and approved by maintainer @takhoffman, was hunting down.

## Why It Happened: The Schema-Padding Problem

OpenClaw's shared `message` tool exposes a single schema surface for both `send` and `poll` actions. That means parameters like `pollDurationHours` (minimum: 1) and `pollMulti` (boolean, default: false) live in the schema even for plain send calls.

Here's the catch: modern AI models are thorough. When generating tool calls, they routinely populate *every* slot they see in a schema with what they consider sensible defaults — even for parameters that are irrelevant to the current action. A plain `send` call might therefore arrive at OpenClaw's runtime looking like this:

```json
{
  "action": "send",
  "text": "Here is your summary...",
  "pollDurationHours": 1,
  "pollMulti": false
}
```

The old `hasPollCreationParams` logic treated *any* non-zero value for shared poll params as evidence of poll intent. A `pollDurationHours: 1` — the schema minimum, echoed reflexively by the model — was enough to trigger the guard and kill the send with a misleading error.

## The Fix

The solution is precise: narrow `hasPollCreationParams` to only check the *content-bearing* poll fields — `pollQuestion` and `pollOption`. Those are the only fields that can appear when an agent actually intends to create a poll. Duration, multi-select, and visibility modifiers remain strictly checked for the channel-extra `poll*` params outside the shared schema surface, since an explicit value there still signals deliberate intent.

The PR adds both a unit test covering the exact schema-pad shape and an integration test on `runMessageAction` confirming that send actions are no longer rejected when only default modifier values are present.

## What This Means for Users

If you have seen agent turns silently fail when your OpenClaw agent was trying to send messages through Telegram, Discord, WhatsApp, Slack, or other channels — especially with verbose models that produce fully-padded tool call completions — this fix likely addresses that class of failure. The patch has been cherry-picked to main and is expected in the next pre-release build.

## The Broader Lesson

This bug is a clean example of the tension between strict schema validation and how LLMs actually behave in production. Models pad schemas. They fill in defaults. Relying on the *presence* of any field as an intent signal creates brittle dispatch logic as schemas grow richer.

The lesson is simple: only gate on content-bearing fields. Modifier-only presence is noise from the model's schema-completion behavior, not signal from the user's intent.

PR #89601 is merged and fully reviewed. [Read the full diff and test coverage on GitHub](https://github.com/openclaw/openclaw/pull/89601).
