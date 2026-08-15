---
title: "OpenClaw Delivers Token-Limited Agent Replies"
excerpt: "OpenClaw now delivers partial replies when an agent hits the model output limit, instead of discarding visible text as a failed runtime turn in long tasks."
coverImage: '/assets/images/posts/openclaw-2026-8-15-token-limited-replies-delivered.png'
date: '2026-08-15T23:15:00.000Z'
dateFormatted: August 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-15-token-limited-replies-delivered.png'
---

OpenClaw merged a high-priority agent runtime fix today for one of the more frustrating failure modes in long answers: the model writes useful text, hits the output token limit, and the user sees a generic failure message instead of the answer so far.

The fix landed in [PR #123546](https://github.com/openclaw/openclaw/pull/123546), "fix(agents): deliver token-limited partial replies instead of discarding them."

## What Was Going Wrong

The broken case was specific:

- The model stopped with `stopReason === "length"`.
- The assistant had visible text.
- There was no terminal tool output.

OpenClaw already passed a `hasAssistantVisibleText` flag into the incomplete-turn classifier, but the `length` branch did not read it. As a result, a reply that had usable text could be classified as incomplete, replaced with the existing "Agent couldn't generate a response" warning, and marked abandoned.

That made the worst possible tradeoff. The longer and more useful the answer was, the more likely it was to hit the token limit and disappear.

## What OpenClaw Does Now

A `length` stop is now treated differently from a pending `toolUse` stop. If the model produced visible text, OpenClaw delivers that text and appends a truncation notice so the user knows the answer is partial.

The PR aligns three boundaries around the same predicate:

- Incomplete-turn classification.
- The delivered truncation notice.
- Durable trajectory status.

That last point is important. The runtime should not tell the user a partial answer was delivered while durable state records the turn as non-deliverable. The new behavior records a delivered text-only truncated reply as success, while a length stop with no visible content still remains non-deliverable.

## User Impact

The practical result is straightforward. When a reply runs out of output budget after producing visible text, the text arrives. The turn stays replayable, the trajectory data matches what happened, and "continue that" can work from the delivered partial answer instead of restarting the task from scratch.

The change is deliberately scoped. Tool-use turns are untouched. Length-stopped turns that already produced terminal tool media or a committed source reply do not get an extra notice. Cron turns whose only payload is a synthesized silent successful tool result stay silent.

## Why It Matters For Agents

Output limits are not rare in agent systems. Agents summarize long files, explain traces, draft posts, inspect logs, and write detailed plans. Losing the partial answer at the exact moment it becomes long enough to be valuable is a reliability bug, not just a polish issue.

The PR author reported observing 20 discarded length-stop replies in 21 hours on a live deployment before the fix. After the fix, forced length-stop runs delivered essay text plus the truncation notice and avoided the incomplete-turn log path.

Focused tests covered terminal resolution, trajectory status, incomplete-turn resolution, lifecycle handling, settled tool evidence, and overflow context recovery. The new cases explicitly pin the delivered-partial path, the no-visible-text path, the no-extra-notice tool-media path, and silent cron behavior.

This is the kind of runtime repair users notice immediately: fewer confusing failures, more recoverable sessions, and a better chance that long-running work can continue from what the model actually produced.

Source: [OpenClaw PR #123546](https://github.com/openclaw/openclaw/pull/123546)
