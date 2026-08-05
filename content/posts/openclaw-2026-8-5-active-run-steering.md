---
title: "OpenClaw Repairs Active Run Steering"
excerpt: "OpenClaw PR #119594 makes user steering reach active OpenClaw, Codex, and GitHub Copilot runs without stale-branch drops."
coverImage: '/assets/images/posts/openclaw-2026-8-5-active-run-steering.png'
date: '2026-08-05T23:02:00.000Z'
dateFormatted: August 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-5-active-run-steering.png'
---

OpenClaw merged [PR #119594, "fix: steering reaches active runs across agent harnesses"](https://github.com/openclaw/openclaw/pull/119594), a P1 session-state and compatibility fix for user messages sent while an agent is already running.

The bug affected one of the most human parts of agent work: interrupting or steering a run that is already in motion. A user could send a correction, but the message might be rejected as a stale branch before it reached the active harness. In other cases, the runtime could not accept the input immediately, and the steering message was at risk of being lost.

GitHub Copilot runs had another edge: the shared UI exposed steering, but the message was not injected into the active SDK session with the same canonical receipt guarantees.

## Shared Admission Rules

The fix moves steering into a shared Gateway invariant instead of treating every harness as a special case. Explicit steering is now admitted as run-owned input at the boundary where OpenClaw can still verify transcript ownership.

The reply operation carries the originating transcript leaf through owner handoff. Moving-leaf admission is allowed only when the exact active owner descends from that leaf, which keeps a steer from being routed into an unrelated run.

Rejected active-run turns remain queued through the shared auto-reply path. That is an important detail: the fix is not just "accept more messages." It preserves the difference between a valid steering input, a stale branch, and a message that needs to wait for the runtime to become ready.

## Copilot Joins The Same Contract

PR #119594 also brings GitHub Copilot runs under the same behavior. The Copilot harness injects steering through its SDK session and acknowledges the steer only after the exact user message is committed to the canonical transcript.

That gives OpenClaw, Codex, and Copilot the same admission and lifecycle model for active-run steering. Users should see a truthful pending `Steering` state until the runtime has actually received the message.

This kind of cross-harness consistency is becoming more important as OpenClaw grows beyond a single built-in runtime. A message composer should not feel reliable with one agent engine and slippery with another.

## User Impact

For users, the practical change is simple: mid-run corrections should land. If an agent is working through a long task and the user says "use the other file," "pause that part," or "continue with this constraint," OpenClaw has a clearer path to attach that message to the active run that owns it.

The fix also reduces confusing stale-branch failures. Moving transcripts are normal in active sessions, especially when UI, Gateway, and agent runtime events are all updating the same conversation. The runtime now has a sharper rule for when a moving leaf is legitimate steering and when it is unsafe.

## Evidence

The PR reports a red reproduction on the unmodified base where a moving-leaf steer failed with `active-leaf-changed`. At the fixed head, 748 focused tests passed across Gateway admission, exact-owner leaf binding, shared registry behavior, built-in agent runs, shared runner E2E, Control UI, Codex, and Copilot.

The author also reports successful `pnpm build`, `pnpm check`, `git diff --check`, and autoreview passes. One broad-suite failure was rerun on pristine main and identified as unrelated to the steering patch.

For OpenClaw operators, this is not a flashy feature. It is better continuity in the moment where humans and agents collaborate most directly: while the work is already happening.
