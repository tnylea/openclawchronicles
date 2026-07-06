---
title: "OpenClaw sessions_send Now Reports Late Failures"
excerpt: "OpenClaw now notifies requester agents when an accepted sessions_send later fails during target session delivery."
coverImage: '/assets/images/posts/openclaw-2026-7-6-sessions-send-failure-notices.png'
date: '2026-07-06T08:03:00.000Z'
dateFormatted: July 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-6-sessions-send-failure-notices.png'
---

OpenClaw merged [PR #99907, "fix: notify requester when sessions_send delivery later fails"](https://github.com/openclaw/openclaw/pull/99907), a P1 agent-runtime fix for a confusing failure mode in agent-to-agent messaging.

The issue affected `sessions_send`, where one agent sends work or context to another session. In some cases, the caller could receive an accepted result with pending delivery, but the target run would later fail while waiting on the target session file lock.

Before this fix, that late failure was only logged. The requesting agent had no signal that the delivery failed, so it could keep operating as if the target session had received the message.

## What Changed

OpenClaw keeps the existing fire-and-forget contract. A `sessions_send` call can still return accepted with pending delivery when the target run has been launched but delivery has not fully completed.

The difference is what happens afterward. When the background agent-to-agent flow sees a concrete delivery or persistence failure, such as `SessionWriteLockTimeoutError`, it now notifies the requester agent.

The PR is intentionally scoped. Waited sends that already returned the error inline do not get duplicate requester turns. Recoverable wait interruptions, including gateway disconnects where delivery is unknown, remain silent.

That boundary matters because not every interrupted wait means failure. The new behavior is reserved for cases where OpenClaw knows the previously accepted send did not actually reach the target.

## Why It Matters

Agent-to-agent messaging has to be transparent about delivery state. If a requester sees "accepted" and nothing else, it can reasonably assume the other session got the handoff. When that assumption is false, downstream behavior gets messy: retries do not happen, fallback routes are skipped, and the user may never see why a workflow stalled.

This fix gives requester agents something actionable. They can retry, choose a different route, or report the failed handoff instead of silently losing a cross-session message.

It also improves OpenClaw's reliability story without changing public APIs. The PR notes there is no new model-facing parameter, config option, storage surface, or public API change.

## Validation

The PR reports focused test coverage for the send tool and A2A flow:

- 22 `sessions-send-tool.a2a` tests passed.
- 35 `openclaw-tools.sessions` tests passed.
- Formatting, linting, `git diff --check`, and local autoreview completed cleanly.

The author also included redacted local behavior proof using the real `createSessionsSendTool` entrypoint, real A2A flow, real `runAgentStep`, and a controlled Gateway RPC stub. The proof shows an initial accepted result, a delayed target wait failure, and a requester notification that includes the lock-timeout signal.

## Bottom Line

`sessions_send` now tells the requester when a previously accepted delivery later fails for a concrete reason. That closes a silent gap in cross-agent workflows and gives agents a chance to recover instead of assuming a message arrived.
