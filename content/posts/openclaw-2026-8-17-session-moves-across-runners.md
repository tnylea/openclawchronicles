---
title: "OpenClaw Adds Session Moves Across Runners"
excerpt: "OpenClaw Gateway now has a durable sessions.move flow for moving live sessions between Gateway, paired devices, and workers."
coverImage: '/assets/images/posts/openclaw-2026-8-17-session-moves-across-runners.png'
date: '2026-08-17T08:02:00.000Z'
dateFormatted: August 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-17-session-moves-across-runners.png'
---

OpenClaw landed a substantial Gateway feature in [PR #125036](https://github.com/openclaw/openclaw/pull/125036): operators can now move a live session between the Gateway, an eligible paired device, and a configured cloud worker profile while preserving the same canonical session identity.

Before this change, a session could be placed on a cloud worker or paired device and later dispatched again, but there was no durable move operation for shifting the same live session directly to another execution location. That left operators with stop-and-continue workflows that could not fully preserve one authoritative session placement across locations.

## What Changed

The new flow is exposed as `sessions.move` and owned by the Gateway. According to the PR, a move now:

- records an opaque durable move intent
- atomically fences the exact active placement
- interrupts the active turn without replaying partial output
- reconciles and tears down the source through the existing lifecycle
- leaves the session local or dispatches it to the selected destination
- recovers pending moves before generic placement recovery after restart

The move target can be the Gateway, another eligible paired device, or a configured worker profile. The session key, transcript, managed worktree, and workspace continue at the destination.

That last point is the feature. OpenClaw is not creating a new conversation that merely resembles the old one. It is preserving the canonical session while changing where future work runs.

## The No-Replay Rule

The PR is explicit that an active turn is interrupted and never replayed. The Control UI warns operators that partial output will not be replayed and asks them to send the next turn again.

That is the right tradeoff for session-state integrity. Replaying an interrupted agent turn across a different runner could duplicate tool calls, repeat external actions, or confuse transcript ownership. A visible interruption is less magical, but it keeps the boundary understandable.

## Control UI Support

The Control UI now exposes "Move session..." from the selected session placement menu. It shows a destination picker, durable moving state, terminal local state after a successful move, and durable failure state if a move cannot complete.

The healthy path stays quiet. The UI does not add extra chrome when placement is normal; it surfaces the move controls and recovery status when there is something the operator needs to decide or repair.

## Why It Matters

OpenClaw's runner model is becoming more distributed. Sessions may start on a Gateway, run on a paired node, move to a worker, or come back local when a device goes offline or a job changes shape.

A durable move primitive makes that topology less brittle. It gives operators a way to change execution placement without abandoning the session record that holds transcript, workspace, and recovery context.

This is especially useful for long-running work, mobile or desktop paired nodes, and cloud worker fleets where capacity, proximity, or access to local resources can change after a session starts.

## Evidence From The PR

The PR reports 191 focused Gateway, protocol, lifecycle, and recovery tests across 14 files, plus 55 focused Control UI tests and two mocked-Gateway browser E2E scenarios. It also includes real-wire proof with a fresh Gateway, isolated state and ports, paired node process, worker children, node-to-Gateway movement, a successful local turn, dispatch back to the same node, and a successful node turn.

Protocol registry checks, Swift generation, Kysely generation, native schema guards, Control UI i18n verification, docs inventory, formatting, linting, and autoreview also passed.

The feature is additive: SQLite uses a lazy companion table without a schema-version bump, and the Gateway protocol version is unchanged.
