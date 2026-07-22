---
title: "OpenClaw Gateway Restarts Now Resume Turns"
excerpt: "OpenClaw can now continue interrupted Gateway turns after restarts, replacing a manual resend prompt with safer automatic recovery."
coverImage: '/assets/images/posts/openclaw-2026-7-22-gateway-restart-resume.png'
date: '2026-07-22T08:01:00.000Z'
dateFormatted: July 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-22-gateway-restart-resume.png'
---

OpenClaw's Gateway restart story improved this morning with [PR #112562](https://github.com/openclaw/openclaw/pull/112562), titled "fix(gateway): resume interrupted turns after restarts instead of asking users to re-send." The change targets a frustrating failure mode: a Gateway restart during an active agent turn could stop the conversation and ask the user to resend the last request.

That message was honest, but not especially helpful. The PR notes that the manual resend often ran the same continuation over the same transcript state. The new policy lets OpenClaw resume the interrupted turn automatically when the stored transcript tail is one of the known restart-safe shapes.

## What Changed

The fix updates `src/agents/main-session-restart-recovery.ts` so restart abort artifacts are recognized more broadly. Partial streamed assistant output no longer blocks recovery just because the interrupted message already contains content. The Gateway's own restart abort reason is also now recognized as a restart artifact.

The more delicate case is an interrupted tool call. If a restart happens after an assistant requested a tool but before the result lands, OpenClaw now classifies the dangling tool call against an audited replay-safety allowlist.

The policy is intentionally conservative:

- Replay-safe dangling tool calls can resume with the full tool catalog.
- Side-effecting dangling tool calls resume with restart-safe tool restrictions.
- Code Mode control calls keep stricter replay-safe checkpoint gating.
- Unknown delivery receipts, pending hooks, stale approvals, and completed-but-undelivered output still fail closed.

That means OpenClaw can continue the conversation without silently repeating an ambiguous external action.

## Why It Matters

Gateway restarts are normal in real deployments. They happen during development rebuilds, upgrades, operator restarts, and supervised process recovery. A personal agent that asks the user to repeat themselves after every mid-turn restart feels less durable than the rest of the system.

This PR makes the restart path feel closer to what operators expect from long-running assistant infrastructure: preserve the transcript, inspect what happened, continue when the evidence is safe, and ask before repeating anything with possible side effects.

The user impact statement is direct: sessions interrupted mid-answer or mid-tool-call now continue automatically instead of ending with the "please send that last request again" notice.

## Proof From The PR

The PR reports a focused `main-session-restart-recovery` suite with 132 passing tests. New coverage includes partial streamed answers, the Gateway restart abort reason, side-effecting dangling calls under restricted tools, and replay-safe dangling calls under unrestricted tools.

Sibling recovery state and store suites added another 25 passing tests. The changed-surface gate passed as well, and the final Codex autoreview was clean after earlier findings around side-effect replay and aborted tool-call tails were fixed.

For OpenClaw operators, this is a reliability upgrade with a security boundary still intact.
