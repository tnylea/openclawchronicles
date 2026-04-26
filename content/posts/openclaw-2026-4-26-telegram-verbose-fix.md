---
title: "OpenClaw Fixes Telegram's Missing Tool Progress Messages"
excerpt: "A stealth regression silenced all verbose progress in Telegram. PR #71825 restores tool, plan, and approval messages when no preview stream is active."
coverImage: '/assets/images/posts/openclaw-2026-4-26-telegram-verbose-fix.png'
date: '2026-04-26T08:15:00.000Z'
dateFormatted: April 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-26-telegram-verbose-fix.png'
---

If your OpenClaw Telegram bot went quiet during long-running tasks — no plan messages, no tool output, no approval prompts, no command results — you were not imagining it. A recent change silently suppressed all verbose progress messages for all Telegram users, regardless of whether they had an active answer preview stream running. [PR #71825](https://github.com/openclaw/openclaw/pull/71825), merged April 26, 2026, brings them back.

## The Two Progress Surfaces

OpenClaw's Telegram integration supports two ways of showing agent activity during a turn:

- **Answer draft preview** — a single message that updates in place as the agent assembles its response, similar to how streaming replies work in a chat interface.
- **Verbose progress bubbles** — individual messages for each significant event: plans, tool calls, approval requests, patch outputs, command results.

When a preview stream is active, the verbose bubbles are suppressed to avoid duplication. That is the intended behavior. When no preview stream exists, verbose bubbles are the only feedback channel.

## What Went Wrong

A previous Telegram change set `suppressDefaultToolProgressMessages: true` **unconditionally** in `extensions/telegram/src/bot-message-dispatch.ts`. The intent was almost certainly to suppress duplicate bubbles when a preview stream was running — but the flag was applied globally, regardless of stream state.

The shared auto-reply dispatcher treats this flag as a blanket signal: suppress tool, plan, approval, patch, and command-output messages. With the flag always `true`, users with no active preview stream had no visibility into agent activity at all. Long-running tasks looked frozen.

## The Fix

[PR #71825](https://github.com/openclaw/openclaw/pull/71825) by contributor VACInc makes the suppression conditional on whether a preview stream actually exists:

```ts
suppressDefaultToolProgressMessages: Boolean(answerLane.stream)
```

If `answerLane.stream` is active, verbose bubbles are suppressed — the preview handles progress display. If not, messages flow through normally. Discord and Slack already gate their equivalent suppression on preview availability; Telegram now matches their behavior.

A regression test was added to confirm that `streamMode: "off"` correctly yields `suppressDefaultToolProgressMessages: false`, verifying that Telegram does not create a draft stream in that mode and does not suppress progress messages.

## Why This Matters

Verbose progress is often the only real-time feedback channel for complex autonomous tasks in Telegram. Without it, users running multi-step tool chains or approval-gated workflows had no way to know what the agent was doing between turns. The regression was particularly painful for anyone using OpenClaw's cron or autonomous agent modes through Telegram.

The fix is narrow and well-scoped. No public SDK changes, no protocol changes, and no other channels are affected.

## What Else Landed Today

Alongside this fix, [PR #71596](https://github.com/openclaw/openclaw/pull/71596) by rubencu addresses a related UX issue in the model configuration flow: when you deselect a model in the picker, its fallback was not being cleared, potentially causing stale fallback references to linger. That fix ensures deselected models are fully removed from the fallback chain.

Both fixes will ship in the next OpenClaw release. To get them now, build from `main`.
