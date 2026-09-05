---
title: "OpenClaw Agents Recover From Temporary Rate Limits"
excerpt: "OpenClaw agents now continue work after temporary provider rate limits, preserving completed tools, partial answers, retry status, and final ownership."
coverImage: '/assets/images/posts/openclaw-2026-9-5-agent-rate-limit-recovery.png'
date: '2026-09-05T23:20:00.000Z'
dateFormatted: September 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-5-agent-rate-limit-recovery.png'
---

OpenClaw has merged a reliability fix for one of the more frustrating failure modes in agent work: a temporary provider rate limit after useful progress has already happened. [PR #139397](https://github.com/openclaw/openclaw/pull/139397), "fix: continue agent tasks after temporary rate limits," landed on September 5, 2026 at 22:53 UTC.

The problem was straightforward. A temporary RPM or TPM limit could stop an agent after it had already completed tools or drafted part of an answer. From the operator's perspective, the work was not necessarily wrong or unsafe. It was just interrupted, and restarting it manually risked duplication.

## How Recovery Works

The fix routes temporary provider failures through a shared attempt recovery owner. OpenClaw now waits with jittered exponential backoff, then injects a short continuation instruction into the existing transcript.

The original user request is not appended again. That detail matters because re-adding the user request can make an agent restart the whole job, repeat tool effects, or lose track of already accepted work.

The new default allows up to eight continuations inside the existing 90-second window, replacing the older three-attempt behavior. Provider pacing carried by the error is honored, and Stop cancels the wait.

OpenClaw keeps terminal cases separate. Authentication failures, billing exhaustion, long-quota exhaustion, refusals, operation-specific terminal outcomes, and timeout-compaction recovery keep their existing handling.

## Better For Long Tasks

This is especially useful for tasks that mix tool calls and explanation. A research run might have already fetched sources. A coding task might have already edited files or run tests. A dashboard job might have created partial artifacts. If a short-lived 429 arrives after those effects, the agent needs continuity, not a blank slate.

The PR says agents preserve completed work and inspect uncertain actions before deciding what to retry. Failed deferred Codex attempts also retain partial text and diagnostics without claiming final-message ownership. The eventual answer keeps final ownership and any settlement warning.

From the UI side, retry progress uses the existing working indicator, survives reconnects, and clears when newer activity supersedes it. That gives operators feedback without creating a second task identity.

## Evidence From Live Testing

The PR includes a baseline reproduction where a completed tool followed by a terminal 429 stopped without continuation. The repaired path was then tested against a live OpenAI API flow: a real 200 response, a completed tool, a locally injected 429, and a real 200 recovery in the same native thread.

The reported outcome was one tool effect, two native turns, one final answer, and a clean reload. Stop during backoff also aborted the run with no further provider request during the observation window.

Focused validation covered core recovery, UI retry and reconnect behavior, Codex transcript and settlement handling, and send/ack regressions. The final integration passed 182 focused recovery and session tests, plus affected type checks, lint, independent P0 to P2 review, and CI on the final commit.

## What Users Should Expect

The user-visible change is less wasted progress. Temporary rate limits should now feel like a pause with visible recovery rather than a terminal failure that forces manual restart.

No new configuration option, database schema, or protocol version was added. The existing embedded-runtime `retry.provider.maxRetries` setting can still override the default retry budget.

For OpenClaw's agent runtime, this is a pragmatic durability improvement. It recognizes that long-running agent work has state, side effects, and partial reasoning worth preserving when the provider asks for a short pause.
