---
title: "OpenClaw Repairs Native Chat Exec Approvals"
excerpt: "OpenClaw PR #93949 keeps native chat exec approvals inline, stopping approval loops across Telegram, Slack, Discord, WhatsApp, and more."
coverImage: '/assets/images/posts/openclaw-2026-6-18-native-chat-exec-approvals.png'
date: '2026-06-18T23:01:00.000Z'
dateFormatted: June 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-18-native-chat-exec-approvals.png'
---

OpenClaw's native chat approval flow got a meaningful reliability fix today. [PR #93949](https://github.com/openclaw/openclaw/pull/93949) changes how exec approvals are handled when the approval happens inside the originating chat thread.

The bug was easy to feel as an operator: an agent asked for approval, the user approved it, but the original agent turn did not resume with the command result. The operator then sent another message to nudge the bot, which kicked off a fresh run and often minted a brand-new approval request.

In other words, the system could fall into an approval loop.

## The User-Facing Failure

Before the fix, native chat approvals could be resolved by the gateway while the model-side turn had already terminated on an `approval-pending` result. A follow-up path then tried to resume the agent, but the result could fail silently or fall through to direct delivery.

That meant the model never saw the actual command output. From the user's perspective, approving the action did not complete the task.

The PR extends the inline approval behavior previously added for WebChat to bundled chat channels that have native approval runtimes. The new native channel list includes:

- WebChat
- Discord
- Google Chat
- iMessage
- Matrix
- QQBot
- Signal
- Slack
- Telegram
- WhatsApp

Channels without native approval clients, along with headless cron and heartbeat runs, keep the existing fire-and-forget path.

## What Changes After Approval

The new behavior keeps the original tool call open while OpenClaw waits for the approval decision. If the operator approves in the same chat, the command runs in that same tool call and the model receives an `Exec finished` result. If the operator denies it, the model sees an `Exec denied` result.

That sounds subtle, but it changes the whole recovery path. The agent does not need a second user message to wake up. The approval does not produce a duplicate prompt. The model can continue from the actual command result, which is the contract users expect when they click an approval button.

## Proof Across Tests and Telegram

The PR includes 18 new parameterized cases covering nine native channels across both inline approval and inline denial. It also keeps regression coverage for channels that should remain on the older path, such as Feishu and explicit `approvalFollowupMode: "agent"`.

The live proof was run through a real Telegram bot with gateway exec approvals forced on. The operator asked the agent to run `date +%s%N`, clicked `Allow once`, and the same Telegram thread received the command result with no extra wake-up message and no duplicate approval prompt.

## Why This Matters

Approvals are one of OpenClaw's central safety boundaries. They only work well when users trust that clicking approve or deny resolves the exact pending action in front of them.

PR #93949 makes that contract tighter for the chat surfaces where many users actually run OpenClaw day to day. It is a workflow repair, but also a trust repair: approvals should feel like a controlled handoff, not a stuck conversation.
