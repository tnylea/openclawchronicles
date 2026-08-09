---
title: "OpenClaw Stops Hook Wakes From Fanning Out"
excerpt: "OpenClaw PR #119817 scopes hook-triggered heartbeat wakes to the intended agent session, preventing unrelated agents from burning tokens."
coverImage: '/assets/images/posts/openclaw-2026-8-9-hook-heartbeat-wake-scope.png'
date: '2026-08-09T08:05:00.000Z'
dateFormatted: August 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-9-hook-heartbeat-wake-scope.png'
---

OpenClaw merged [PR #119817, "fix(hooks): target hook-triggered heartbeat wakes at the hook agent/session"](https://github.com/openclaw/openclaw/pull/119817), closing a subtle automation bug that could make one hook wake unrelated agents.

The issue lived in the path where Gateway hooks run an isolated agent turn and then request an immediate heartbeat wake so the result or failure is picked up promptly. The hook itself named a target agent or session, but two follow-up wake sites did not carry that same scope. In OpenClaw's heartbeat runner, an unscoped immediate wake acts as a global flush barrier, so it can fan out to every heartbeat-enabled agent.

That turned a targeted hook event into extra heartbeat turns on agents that had nothing to do with the hook.

## What Changed

The fix makes the post-run wake target the same agent and session that received the hook event. The PR notes that `requestHeartbeat` already supports `agentId` and `sessionKey`; the missing piece was passing those values consistently from the hook dispatch path.

The change covers both successful announced hook results and hook failures. It also keeps a fallback path aligned with the same fallback session used for error delivery when configuration cannot be resolved early enough.

The PR repaired several edge cases during review:

- Hook wakes for known agents without recurring heartbeat schedules now run once instead of being skipped.
- Unnamed hooks avoid carrying a stale default agent when the event session already identifies the owner.
- Global-scope hook events receive owner-agent metadata so concurrent hooks from different agents do not consume each other's queued events.
- Default-agent reloads no longer retarget global hook results at the wrong agent between dispatch and queue execution.

## Why It Matters

Hooks are supposed to be precise automation boundaries. A webhook for one agent should not quietly buy model calls on a fleet of unrelated heartbeat agents.

The PR body cites one reported install where the old behavior caused 33 heartbeat legs over roughly 11 days on a premium-pinned reviewer agent, with 19 producing no output. The dollar amount in that report was small, but the product bug was bigger than the bill: operators could not easily connect those extra turns back to the hook that caused them.

By making the wake follow the event's owner, OpenClaw preserves the automation expectation: the targeted agent receives the prompt, unrelated agents stay idle, and hook failures remain visible without becoming a global wake storm.

## Validation

The PR includes a large body of focused regression coverage. Reported tests covered Gateway hook trust behavior, heartbeat runner scheduling, hook wake policy, identity filtering, and transient system-event ownership.

The most useful proof is the real gateway-to-runner trace described in the PR: before the fix, a hook wake for an unscheduled `ops` agent produced zero targeted runs and left the queued event unread. After the fix, the targeted wake ran exactly once for `ops` and did not run unrelated agents.

For operators who rely on OpenClaw hooks to bridge external systems into agents, this is the kind of maintenance change that makes automation feel boring in the right way. The hook wakes the agent it was meant to wake, and nothing else.
