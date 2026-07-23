---
title: "OpenClaw Fixes Active Codex Steering"
excerpt: "OpenClaw Control UI steering now reaches the active Codex turn instead of becoming a delayed follow-up after the original task finishes."
coverImage: '/assets/images/posts/openclaw-2026-7-23-control-ui-codex-steering.png'
date: '2026-07-23T08:02:00.000Z'
dateFormatted: July 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-23-control-ui-codex-steering.png'
---

OpenClaw merged a focused but highly visible Codex fix in [PR #112858](https://github.com/openclaw/openclaw/pull/112858): steering an active Codex task from the Control UI now reaches the currently running turn.

Before this patch, a user could send a steering message while Codex was already working and see that message accepted by the UI. The problem was delivery timing. Instead of reaching Codex during the active turn, the message could become a later follow-up after the original run finished.

That is a subtle failure, but it breaks the promise of steering. If the operator says "adjust this now," the instruction needs to affect the work in progress.

## What Changed

The fix advertises transcript-backed steering capability on the active Codex run handle. That lets the shared queue path deliver the message immediately through `turn/steer` instead of rejecting it before the active-turn steering path.

The PR body says Codex already confirms a steer only after its user-message item completes. That completion boundary satisfies the Gateway-owned transcript-commit contract, so the queue can wait for the right proof before treating the steering message as committed.

In simpler terms: Control UI sends the steering instruction, Codex receives it inside the current turn, and OpenClaw waits for the matching transcript event before considering the delivery complete.

## Why It Matters

Active steering is one of the features that makes long-running coding agents feel controllable. Without it, users have to cancel and restart, wait for the current turn to finish, or hope the delayed follow-up still makes sense by the time it lands.

That is especially painful for Codex tasks because timing can matter. A user might notice the agent is editing the wrong file, pursuing an outdated assumption, or missing a constraint. The UI can accept the correction, but acceptance is not enough. The message has to join the active turn while it can still change the outcome.

This patch closes that gap for Control UI to Codex steering.

## The Regression Proof

The PR includes a canonical-base reproduction showing that the public gateway-style queue returned `accepted=false` before any `turn/steer` on the old behavior. The fixed branch passed 49 shared active-run tests and 9 Codex steering tests on Blacksmith Testbox.

There is also an independent real-Chromium Control UI entry-point check. That test emitted `chat.send` in steer mode, proving the browser path exercised the same behavior instead of only validating a lower-level helper.

The new regression verifies `waitForTranscriptCommit: true`, checks the generated `clientUserMessageId` on `turn/steer`, keeps an unrelated-completion negative control, and resolves only when the matching Codex user-message completion arrives.

## A Small Patch With Big UX Impact

The code delta is modest: 162 additions and 13 deletions across seven files. That fits the nature of the bug. The system already had most of the steering machinery; the active Codex handle just needed to expose the right transcript-commit capability so shared queue delivery could trust the path.

For OpenClaw users running Codex from the Control UI, the takeaway is simple. Steering should now feel immediate again. A correction sent during a task is much more likely to influence that task, not queue up as advice for the next one.

That makes Codex sessions easier to supervise, especially during longer edits where the best operator intervention is a quick course correction rather than a full stop.
