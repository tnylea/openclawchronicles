---
title: "OpenClaw Preserves Codex Subagent Results"
excerpt: "OpenClaw fixed a Codex runtime race so subagent completions are not lost when a parent turn yields before consuming them."
coverImage: '/assets/images/posts/openclaw-2026-7-16-codex-subagent-yield.png'
date: '2026-07-16T23:03:00.000Z'
dateFormatted: July 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-16-codex-subagent-yield.png'
---

OpenClaw merged a Codex runtime fix on July 16 that targets a subtle message-loss race in parent and subagent workflows. [PR #105724](https://github.com/openclaw/openclaw/pull/105724), `fix(codex): preserve subagent completions after sessions_yield`, landed at 10:26 UTC.

The failure mode involved a parent run accepting a subagent completion steer, then calling `sessions_yield`. If the parent turn was interrupted before Codex consumed the accepted input, the subagent completion could be lost.

That is a serious reliability issue for delegated coding work. Subagents are useful only if their final results reliably make it back to the parent turn.

## What Changed

The fix separates RPC acceptance from transcript consumption. In Codex, `turn/steer` accepts input into the active turn queue, while `turn/interrupt` clears pending input. OpenClaw now treats the durable consumption signal as the matching completed `userMessage` item.

Each steer remains pending under an exact `clientUserMessageId` until Codex emits `item/completed` for the matching `userMessage.clientId`. That identity-based tracking replaces a less precise FIFO inference path.

If a terminal yield succeeds before the steer is consumed, OpenClaw cancels the unconsumed steering before interrupting. That lets the existing completion fallback retry on a fresh parent turn. If a yield fails or is not terminal, the steering remains usable.

Run aborts close the queue immediately so an accepted but unconsumed wake cannot hang around during cleanup.

## Why This Matters

OpenClaw's Codex integration is increasingly built around parallel work, child sessions, and resumable agent flows. A parent agent may spawn subagents, yield while they work, and later incorporate their results.

When that handoff works, the model is powerful: one parent can coordinate focused child investigations or implementation tasks without blocking the entire workflow. When the handoff drops a completion, the parent may continue without critical evidence or conclude that the child never responded.

This PR improves the contract at the exact boundary where those systems meet: accepted input must either be consumed by Codex or safely retried.

## Upstream Contract Checked

The PR cites upstream Codex behavior at a specific commit, including `turn/steer` support for `clientUserMessageId`, forwarding of that ID into core steering, and the fact that interrupt clears queued pending input.

That matters because this is not just an OpenClaw queue bug. It is a protocol edge between OpenClaw's parent/subagent orchestration and Codex's app-server turn lifecycle.

By anchoring the fix to the upstream contract, OpenClaw avoids guessing whether a steer was consumed. It waits for the transcript item that proves consumption happened.

## Evidence

The PR reports focused coverage around identity-based steering, terminal yield behavior, failed and non-terminal yield behavior, abort cleanup, and matching completed user messages.

It also includes links to the upstream Codex source used to verify the relevant steering and interrupt semantics. The changed code spans the Codex runtime path without changing the broader announce-routing or shared configuration model.

## Operator Takeaway

If you use Codex-backed OpenClaw agents with subagents, `sessions_yield`, or long-running delegated work, PR #105724 is a reliability fix worth tracking.

The important user-facing change is that a child result accepted by the parent should not disappear just because the parent yielded at an unlucky moment. OpenClaw now keeps that result pending until Codex proves it consumed it, or hands it back to the retry path.
