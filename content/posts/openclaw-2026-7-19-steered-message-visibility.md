---
title: "OpenClaw Keeps Steered Messages Visible in Chat"
excerpt: "OpenClaw fixed a Control UI bug where messages sent while an agent was busy could vanish until a later transcript reload."
coverImage: '/assets/images/posts/openclaw-2026-7-19-steered-message-visibility.png'
date: '2026-07-19T23:03:00.000Z'
dateFormatted: July 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-19-steered-message-visibility.png'
---

OpenClaw shipped a P1 Control UI session-state fix tonight in [PR #111540](https://github.com/openclaw/openclaw/pull/111540), `fix(ui): keep steered composer messages visible until the transcript owns them`. The bug hit a common workflow: typing into the chat composer while an agent was already working.

Before the fix, the UI could briefly show a steering state and then lose the visible copy of the user's message. The message eventually landed in the transcript, but only after a later history reload. That gap is unsettling because the user cannot tell whether OpenClaw accepted the instruction, dropped it, or is still processing it.

## What Changed

The PR centers the fix on one invariant: from submit until the transcript contains the steered text, some visible copy must exist.

That visible copy can move through several states:

- a queue row while the message is still pending;
- a steering state while it is being accepted;
- a "Steered" chip once the Gateway accepts it;
- a materialized user turn once the transcript owns it.

The underlying issue came from the steer path removing the durable queue row as soon as `chat.send` acknowledged, then failing to restore the visible chip in several real-world run states. The PR notes that this happened for runs started by automations, other clients, or tabs opened mid-run, where the session row knew a run was abortable but the tab did not have a local `chatRunId`.

The fix reuses the row's `sendRunId` as the wire idempotency key, restores the chip after accepted acknowledgements, materializes acknowledged chips into the transcript before terminal cleanup, and keeps idempotency-marked local turns through stale history reloads.

## Why It Matters

Steering is one of the small interactions that makes an agent feel live instead of batch-oriented. You should be able to add a correction, a follow-up, or a new constraint while the agent is working and trust that the UI will not make your text disappear.

This is also a multi-client bug class. The PR explicitly calls out automations, other clients, and tabs opened mid-run. Those are normal OpenClaw scenarios, not edge cases, so the UI needs to represent accepted work even when the local tab did not initiate the active run.

## Evidence

The focused regression coverage is substantial. The PR reports 520 tests passing across chat send, chat view, chat thread, and history merge suites. New cases cover session-row-only steering, idempotency key reuse, pre-ack chip restoration, terminal-event materialization, stale history reload preservation, and a guard against phantom turns when an unacknowledged steer is rejected or interrupted.

The team also attached live Mantis Control UI proof with screenshot, recording, and raw QA artifacts, and followed up on review findings around preserving the original queued turn and resolving steered attachment payloads through the payload store.

## Operator Takeaway

Users should no longer see composer input vanish while an agent is busy. There is one bounded tradeoff: in the previously broken scenario, the steered chip can briefly coexist with the same turn once history catches up. That is a much better failure mode than a silent visibility gap.

For a chat-first agent system, this is the kind of polish that preserves trust.
