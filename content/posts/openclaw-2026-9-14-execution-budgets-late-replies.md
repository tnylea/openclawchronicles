---
title: "OpenClaw Preserves Budgets And Late Replies"
excerpt: "OpenClaw PR #148508 keeps ACP turns, command continuations, recovered children, node calls, and late task replies inside their intended budgets."
coverImage: '/assets/images/posts/openclaw-2026-9-14-execution-budgets-late-replies.png'
date: '2026-09-14T23:05:00.000Z'
dateFormatted: September 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-14-execution-budgets-late-replies.png'
---

OpenClaw merged [PR #148508](https://github.com/openclaw/openclaw/pull/148508), a P1 reliability fix for long-running ACP turns, approved command continuations, recovered children, node operations, and late task replies.

The issue was not one timeout. It was a family of ownership problems where a shorter startup, monitor, wait, or transport deadline could accidentally cut across the budget that belonged to the actual run owner.

## What Changed

The PR removes duplicate ACPX turn timers, drops a fixed approval-continuation limit, and carries saved child execution budgets through recovery and resume paths. That includes explicit zero values, which matter because zero is a real configuration choice rather than an absent value.

Node operations now use one timeout calculation with transport grace. A2A observers also reuse the run-wait owner through nonterminal snapshots, while foreground waits remain bounded.

For users, the practical outcome is more predictable long-running work:

- ACP turns keep the budget they were admitted with.
- Approved command continuations do not inherit an unrelated short cap.
- Recovered or resumed child tasks retain their saved timeout.
- Long node operations get enough time at both invocation and transport layers.
- Late session replies remain observable instead of disappearing behind a shorter wait.

Explicit shorter overrides and cancellation are still supposed to work. The patch is about keeping deadlines attached to the right owner, not making every task unbounded.

## Why It Matters

OpenClaw users increasingly run tasks that do not fit into a chat-response-sized window: background reviews, node operations, child tasks, ACP sessions, and command continuations. Those workflows need timeouts, but the timeout has to describe the work being protected.

If a monitor or startup timer expires first, the system can look flaky even when the underlying job is still healthy. That is especially painful for automations where a late reply may be the only visible proof that a background task completed.

This fix makes the runtime model easier to reason about: the run owner decides the budget, observers watch without stealing ownership, and terminal timeout classification is shared.

## The Proof

The PR says the maintainers reproduced all six defects by running new regressions against the original production code. The candidate then passed 1,140 distinct tests across 17 focused and sibling files, covering ACP startup and cancellation, approval continuations, child recovery and resume, heartbeat coalescing and isolation, late A2A replies, node overrides, and E2E announcement delivery.

The validation also included a full source build, runtime postbuild validation, changed-file checks, and independent Codex review through P2. Hosted CI later passed on exact head with 144 successful GitHub checks, and native prepare and merge verified the same head.

## What To Watch

PR #148508 does not promise durable delivery across a Gateway restart for in-memory observation. It does make the live runtime less likely to lose work simply because a neighboring wait budget expired first.

For anyone using OpenClaw for longer background tasks, this is one of those quiet fixes that should reduce surprise in exactly the moments where surprise is expensive.
