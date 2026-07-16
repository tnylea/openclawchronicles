---
title: "OpenClaw Recovers Channel Turns After Restarts"
excerpt: "OpenClaw now persists channel-turn recovery evidence earlier, reducing duplicate replies and unnecessary resend prompts after gateway restarts."
coverImage: '/assets/images/posts/openclaw-2026-7-16-gateway-restart-turn-recovery.png'
date: '2026-07-16T08:02:00.000Z'
dateFormatted: July 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-16-gateway-restart-turn-recovery.png'
---

OpenClaw merged a major restart-recovery change for channel turns this morning. [PR #108283](https://github.com/openclaw/openclaw/pull/108283), `fix: channel turns recover safely after gateway restart`, merged at 06:01 UTC on July 16.

The change targets a frustrating reliability edge: a gateway restart could leave OpenClaw asking a user to resend a request even when the system already had enough durable evidence to finish the turn or resume it safely. In another case, a newly accepted channel request could disappear before the user turn reached the transcript.

## What Changed

Channel ingress now records the user turn and the restart-recovery claim atomically before hooks or model execution. That means OpenClaw has durable evidence earlier in the request lifecycle, before the system crosses into side effects that are harder to replay.

Same-conversation terminal message sends now receive an exact source-turn receipt. During recovery, OpenClaw reconciles that receipt instead of blindly replaying the turn. If the terminal reply was already delivered, recovery should not send it again.

The authority boundary remains narrow. Recovered message authority is still bound to the original session, account, sender, channel, target, and thread. That matters because restart recovery should make interrupted work durable, not create a new route for sending messages under looser identity rules.

## Ambiguous Effects Still Fail Closed

The PR is careful about side effects whose outcome is unknown. Before a terminal source send reaches the provider, the exact session now records a pending delivery intent. A confirmed success resolves that marker as delivered, and a confirmed non-delivery clears it.

If OpenClaw crashes or times out while the outcome is unknown, recovery keeps the pending marker and asks for a clean retry instead of replaying the remaining effects. That preserves the one-time resend behavior for genuinely ambiguous work.

This is the right shape for agent recovery. Durable evidence should eliminate unnecessary human friction, but uncertainty around external effects should still fail closed.

## User Impact

For Discord and other channel users, the practical impact is smoother recovery after a gateway restart. Safely resumable turns can continue automatically, terminal replies that already reached the provider should not duplicate, and accepted turns should no longer vanish before transcript persistence.

For operators, the change reduces a class of noisy "please resend" moments that make agents feel brittle during restarts or deploys.

## Evidence and Scope

The PR reports a focused restart-recovery matrix with 779 passing tests across gateway, runtime, agents, unit, and end-to-end shards. A post-rebase smoke run added 161 passing tests across restart recovery and gateway send suites.

The covered behaviors include atomic channel admission, hook checkpoints, source-ID isolation, pre-send terminal intents, exact receipt reconciliation, session rotation, requester and route authority, bounded bearer lifetime, diverted outcomes, unknown delivery outcomes, and duplicate prevention.

There is no Gateway protocol, public plugin SDK, or configuration surface change in the PR. This is internal reliability work at the boundary between channel ingress, transcripts, delivery receipts, and restart recovery.

## Why This Is Important

Agents are useful only when users can trust them across ordinary operational events. Restarts happen. Deploys happen. Gateways reconnect. The system should distinguish between "we safely know what happened" and "we need a human to retry."

This PR makes that distinction sharper for channel turns. It moves OpenClaw closer to the behavior operators want: resume when the evidence is durable, avoid duplicates when delivery is confirmed, and ask for help only when the system cannot honestly prove the outcome.
