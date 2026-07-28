---
title: "OpenClaw Stops Cancelled Agent Zombie Loops"
excerpt: "OpenClaw now blocks cancelled or timed-out agent turns from starting orphaned background loops that can keep spending model tokens."
coverImage: '/assets/images/posts/openclaw-2026-7-28-cancelled-agent-zombie-loops.png'
date: '2026-07-28T08:05:00.000Z'
dateFormatted: July 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-28-cancelled-agent-zombie-loops.png'
---

OpenClaw merged a high-priority agent runtime fix this morning with [PR #115011, "fix(agents): stop cancelled runs from spawning zombie agent loops"](https://github.com/openclaw/openclaw/pull/115011). The patch closes a cancellation race where a visible turn could end, but the underlying agent prompt could still begin afterward.

The user-facing risk was cost and confusion. If a user cancelled a run or a run timed out right before prompt startup, the visible session could appear finished while an orphaned background agent loop continued making model calls.

## What Changed

The fix adds an abort check at the embedded prompt boundary. Before the session prompt is evaluated, the prompt owner now checks the existing run abort signal. If the turn was already cancelled, OpenClaw rejects it through the existing tagged abortable helper instead of starting the model call.

That keeps the fix narrow. The PR does not change provider behavior, retry policy, configuration, dependencies, or public APIs. It preserves the canonical abort classification, reason propagation, transcript ownership, terminal precedence, and ordinary prompt behavior for healthy runs.

In other words, the patch does not make cancellation more aggressive everywhere. It closes the moment where a cancelled run could cross from "about to prompt" into "actively spending tokens."

## Why It Matters

Agent cancellation is a trust contract. When a user hits stop, or when a timeout ends a turn, the system needs to stop the work that belongs to that turn. A visible stop that leaves a hidden loop running is the kind of bug that erodes confidence quickly, especially on expensive hosted models or long-running delegated work.

The PR summary describes the bad case clearly: the orphan "could continue making model calls and accumulate unbounded cost." That makes this more than a cosmetic runtime cleanup. It is a guardrail around ownership, cancellation, and spend.

The fix also matters for fast chat surfaces. Rapid interrupt-mode messages, mobile commands, and timeout recovery can all create tight timing windows. Those are exactly the places where a small race can become a recurring support issue.

## Verification

The maintainers validated the bug red-before-fix on fresh main. The new external-cancellation and run-timeout regressions both failed because `activeSession.prompt` was invoked after abort.

After the fix, 55 focused tests passed across the prompt boundary, abortable helper, external abort, prompt submission, execution cleanup, and canonical agent-run terminal outcome.

The PR also includes real product proof. An isolated Gateway, mock OpenAI-compatible provider, Crabline Telegram transport, and native stop/recovery scenario passed. The scenario starts a delayed agent turn, aborts it with `/stop`, verifies the abort acknowledgement, and proves the next user turn succeeds.

The full changed gate passed too, including typechecks, formatting, core lint, plugin and SDK boundaries, import cycles, storage guards, dependency checks, config ratchets, and security guards. A fresh independent Codex autoreview and TruffleHog scan also passed.

## Bottom Line

[PR #115011](https://github.com/openclaw/openclaw/pull/115011) makes OpenClaw cancellation more honest. Cancelled and timed-out turns can no longer start a background agent loop after their owning turn is gone, while normal prompts and follow-up replies continue through the existing runtime path.
