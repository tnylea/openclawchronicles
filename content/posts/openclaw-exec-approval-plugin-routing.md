---
title: "OpenClaw Keeps Plugin Approval Replies Routed"
excerpt: "OpenClaw fixed exec approval followups for external channel plugins, keeping post-approval replies in the originating chat instead of webchat."
coverImage: '/assets/images/posts/openclaw-exec-approval-plugin-routing.png'
date: '2026-06-24T08:02:00.000Z'
dateFormatted: June 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-exec-approval-plugin-routing.png'
---

OpenClaw merged [PR #96140, "fix(exec): preserve turn-source routing target in approval followups for plugin channels"](https://github.com/openclaw/openclaw/pull/96140), a routing fix for external channel plugins using exec approvals.

The bug was easy to miss from the outside. A user in an external channel plugin could approve an async exec request with `/approve <id>`, but the resumed agent reply could land in webchat instead of the channel where the approval happened. The user approved the command, but the result showed up somewhere else.

For agent operators, that kind of bug feels worse than a simple failure. The command may have run, the approval may have been accepted, and the agent may have replied, but the human waiting in the original channel never sees the outcome.

## The Routing Gap

The PR explains the root cause in OpenClaw's exec approval followup path. When an approval is resolved, `sendExecApprovalFollowup` resumes the originating session by dispatching a gateway `agent` call. That call needs to carry the original turn source: channel, recipient, account id, and thread id.

Before this fix, `buildAgentFollowupArgs` preserved the channel in more cases than it preserved the rest of the routing target. Built-in channels were covered because they are part of OpenClaw's deliverable channel set. Gateway-internal channels had a separate path. But an external channel plugin might not be registered inside the process running the followup, so the code could preserve the plugin channel name while dropping `to`, `accountId`, and `threadId`.

Downstream, the gateway had less information than it needed and could fall back toward an internal or webchat route.

## What Changed

The patch forwards the raw turn-source routing fields whenever OpenClaw is not using a resolved delivery target. In practice, that means the resumed run keeps the same target data that was captured with the original exec request.

The PR describes the new behavior as preserving:

- The plugin channel id
- The original recipient target
- The account id
- The thread id

Built-in channels continue to use their normalized delivery target branch. Sessions without a turn source still forward `undefined` values. The important change is that external plugin channel approval followups no longer lose the recipient fields while keeping only the channel name.

## Why It Matters

OpenClaw's plugin channel ecosystem is expanding, and native approval runtimes are exactly where routing needs to be dependable. Users approve commands in context. The result should return to the same context unless the user explicitly routed it elsewhere.

This fix is also a good example of preserving data instead of rediscovering it. The original turn source already had the needed routing fields. The followup builder simply needed to carry them through to the gateway, which remains the routing authority.

## Verification

The PR includes a regression test named `preserves the originating routing target for non-built-in plugin channels`. It failed on pristine `origin/main` and passed with the patch.

The author also drove the real `sendExecApprovalFollowup` production function with identical plugin-channel inputs before and after the patch. The before case only carried the channel and `deliver:false`; the after case carried the channel plus `to`, `accountId`, and `threadId`, still with `deliver:false`.

That is exactly the behavior this bug needed: do not force delivery locally, but do hand the gateway the original route so it can deliver the post-approval reply back to the correct chat.

## Bottom Line

Exec approvals are trust moments. When a user approves an action from a channel plugin, OpenClaw needs to keep the post-approval reply in that same conversation.

[PR #96140](https://github.com/openclaw/openclaw/pull/96140) closes that routing gap for external channel plugins and should make approval-driven workflows feel much less confusing.
