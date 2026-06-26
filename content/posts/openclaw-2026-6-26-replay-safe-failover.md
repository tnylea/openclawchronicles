---
title: "OpenClaw Model Fallback Handles Safe Timeouts"
excerpt: "OpenClaw can now recover from replay-safe prompt-stage provider timeouts without replaying abandoned or side-effectful work."
coverImage: '/assets/images/posts/openclaw-2026-6-26-replay-safe-failover.png'
date: '2026-06-26T08:03:00.000Z'
dateFormatted: June 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-26-replay-safe-failover.png'
---

OpenClaw merged [PR #96142, "fix(failover): fallback on replay-safe prompt timeouts"](https://github.com/openclaw/openclaw/pull/96142), a P1 agent-runtime fix for model fallback behavior.

The bug was narrow but important. A replay-safe prompt-stage provider timeout could surface as a terminal error even when fallback models were configured for the run. That means OpenClaw could have a valid backup model available, but still stop at the first provider timeout.

The new policy lets fallback happen only when the runtime can safely replay the prompt attempt.

## What Changed

The failover policy now allows model fallback for harness-owned timeout errors under specific conditions:

- The timeout happened during the prompt request.
- The attempt is replay-safe.
- The harness has not marked the timeout as replay-invalid.
- The failure is not a Codex app-server transport failure.

That last set of constraints matters. OpenClaw is not broadly retrying every timeout. Plugin harness lifecycle failures and abandoned-turn timeouts remain in the existing surface-error path.

The result is a more careful fallback boundary: recover when the model prompt can safely be retried elsewhere, but avoid replaying work that may already have side effects or an uncertain state.

## Why It Matters

Model fallback is only useful when the runtime knows where it is safe to move on. If a provider times out before doing any non-replayable work, failing over to a secondary model can save the run. If a timeout happens after tool activity, abandoned work, or a transport-level failure, retrying blindly can create duplicate actions or confusing state.

PR #96142 draws that line around prompt-stage, replay-safe failures. That is exactly where fallback is most valuable: before the agent has committed to side effects, but after the primary model failed to respond in time.

For users, this should feel like fewer unnecessary terminal errors when fallback models are already configured. For operators, it makes fallback chains more trustworthy because the policy is not just "try the next model"; it is "try the next model only when replay is safe."

## Validation

The PR includes `P1`, `proof: sufficient`, and `merge-risk: auth-provider` labels. Its focused test run covered failover policy, prompt-timeout fallback, and Codex app-server recovery tests, with 46 tests passing across three files.

The author also notes that autoreview found an initial replay-invalid timeout gap. The fix added a guard on `attempt.promptTimeoutOutcome?.replayInvalid !== true` and a regression test before final review passed cleanly.

That review history is a useful signal. The change is not merely adding a retry path; it is tightening the replay-safety conditions around that path so OpenClaw can recover from provider timeouts without creating a new class of duplicate-work bugs.
