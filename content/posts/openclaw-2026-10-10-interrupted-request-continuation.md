---
title: "OpenClaw Recovers Interrupted Requests on Continue"
excerpt: "OpenClaw PR #168279 lets agents use bounded previews of interrupted inputs when users ask them to continue later."
coverImage: '/assets/images/posts/openclaw-2026-10-10-interrupted-request-continuation.png'
date: '2026-10-10T08:03:00.000Z'
dateFormatted: October 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-10-interrupted-request-continuation.png'
---

OpenClaw merged [PR #168279](https://github.com/openclaw/openclaw/pull/168279), a recovery fix for sessions where the user asks an agent to continue after the original request was interrupted before execution.

The visible bug was frustrating: the Control UI could still show the interrupted request, but the agent did not receive enough context to continue from it. A user could type "continue" and see the system behave as if the original work had vanished.

## What Changed

OpenClaw now adds a bounded historical snapshot of retained interrupted input into the existing turn-context path. The snapshot is scoped to the physical session and limited to three previews of up to 4,000 characters from the latest retained-input page.

That wording matters. The fix does not replay old input, restore expired permissions, or expose queued, cancelled, hidden, or context-excluded messages. It gives the agent enough historical conversation data to understand what "continue" refers to while keeping custody and authorization boundaries intact.

The final version also tightened account handling. Interrupted previews now use the existing authorized history writer's target rather than caller-owned memory or an unknown account. Execution revalidates that same history capability for resumed turns and fresh recovery.

## Why It Matters

Long-running agent work often crosses messy boundaries: browser refreshes, Gateway restarts, interrupted turns, delayed recovery, and a human coming back later with a short follow-up. "Continue" only works if OpenClaw can bridge what the UI remembers with what the model is allowed to see.

Without that bridge, retained pending inputs become a display artifact instead of recoverable context. With it, built-in and CLI agent turns can understand the interrupted request in a constrained way.

The PR's contract is careful:

- Current request and transcript bytes stay unchanged.
- Retained inputs are previewed, not replayed.
- Cancelled and context-excluded messages remain excluded.
- Cross-account or unverifiable-account cases do not leak previews.
- Revoked authority prevents resumed transport dispatch.

That combination is the heart of the fix: useful recovery without making interruption state a shortcut around normal access rules.

## Evidence From The PR

The PR includes a real SQLite accepted-input regression. Before the fix, the production prompt-assembly boundary produced empty continuation context. After the repair, it exposed the interrupted request without consuming or replaying it.

The final proof covered cross-account and unverifiable-account leak cases, resumed dispatch after authority revocation, raw prepared input capture, and same-account previews. The focused suite passed 53 tests across four files, along with production types, test-type groups, lint, SQLite-worker guards, test-race checks, mock guards, and independent review.

There was also a later correction for CLI media-suffix ordering, keeping interrupted-request context before an existing media snapshot so media progress remains in the private context suffix.

## Bottom Line

PR #168279 makes OpenClaw more dependable when work is interrupted midstream. If the UI still has a retained request and the session authority still checks out, agents get bounded context to continue the work instead of losing the thread.
