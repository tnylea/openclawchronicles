---
title: "OpenClaw Scopes Agent Cron Wake Targets"
excerpt: "OpenClaw PR #97949 closes a cron wake-target gap by binding agent-originated wake requests to the calling agent."
coverImage: '/assets/images/posts/openclaw-2026-6-30-cron-wake-target-scope.png'
date: '2026-06-30T08:02:00.000Z'
dateFormatted: June 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-30-cron-wake-target-scope.png'
---

OpenClaw merged [PR #97949](https://github.com/openclaw/openclaw/pull/97949) just after the nightly run cutoff, closing a cron boundary gap around agent wake requests.

The problem was specific but important. Agent-tool cron operations were already scoped to the calling agent, but the wake action could still target a session owned by another configured agent. That made wake behavior less strict than the rest of the cron tool contract.

PR #97949 brings wake back into the same model: agent-originated cron wake requests are scoped to the calling agent, while direct authenticated operator wake behavior stays global.

## What Changed

The PR attaches the existing trusted agent-runtime identity to wake calls, rejects foreign agent IDs and agent-prefixed session keys in the cron tool, and enforces the same invariant at the Gateway handler.

Accepted agent-originated calls are bound to the authenticated caller. Same-agent cross-session wake routing still works, so an agent can wake its own current session or another lane owned by that same agent. Direct operator and CLI requests keep their existing unscoped targeting behavior.

That distinction is the whole point. Human operators with the right authentication can still manage cron globally. Agent-originated tool calls stay inside the agent boundary they came from.

## Why This Matters

Cron is one of OpenClaw's most powerful surfaces. It can wake sessions, run scheduled work, and keep agents alive across time. That power is useful only if the target rules are predictable.

Before this fix, the cron tool could reject a foreign agent for one operation and still forward a wake request for a foreign agent session. That kind of inconsistency is exactly where automation systems become surprising.

The fix does not add a new permission system or migration surface. It extends the existing agent-runtime identity contract to the wake path and checks it in both the tool and Gateway layers.

## Evidence In The PR

The PR includes a clear before-and-after probe. Before the change, a scoped tool rejected a cross-agent list request but still forwarded the cross-agent wake path. After the change, the probe reports:

```text
listCrossAgent: cron list agentId must match the calling agent
wakeCrossAgent: cron sessionKey must match the calling agent
Gateway calls: 0
```

The validation set is also focused: cron tool tests, Gateway client tests, Gateway handler regression coverage, linting, formatting, diff checks, and a local autoreview pass. The targeted Vitest run passed 314 tests across two shards.

The PR notes that one remote changed gate could not be launched from the checkout because no usable Crabbox or Blacksmith client was installed, so PR CI remains the broader validation path.

## A Cleaner Automation Boundary

This is a security-boundary and session-state fix, but the day-to-day benefit is operational clarity. Agents can wake their own work. Operators can wake anything they are allowed to manage. Agent tool calls cannot quietly jump across agent ownership by choosing a foreign session key.

That model is easier to explain, easier to audit, and safer for multi-agent OpenClaw deployments where cron is used as real automation infrastructure rather than a convenience feature.
