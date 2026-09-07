---
title: "OpenClaw Stops Obsolete Tool Replies"
excerpt: "OpenClaw now suppresses obsolete deferred tool replies, so users receive the accepted final answer without stale intermediate messages replaying later."
coverImage: '/assets/images/posts/openclaw-2026-9-7-obsolete-tool-replies.png'
date: '2026-09-07T23:10:00.000Z'
dateFormatted: September 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-7-obsolete-tool-replies.png'
---

OpenClaw has landed a P1 agent-runtime fix for tool-using conversations that deferred reply delivery. [PR #141444](https://github.com/openclaw/openclaw/pull/141444), "fix(agents): stop replaying obsolete replies after tool continuations," merged on September 7, 2026 at 18:51 UTC.

The bug could produce a confusing finish to a conversation: older intermediate answers were replayed after the final accepted answer, or even after a terminal `NO_REPLY`. That is exactly the kind of small transcript error that makes an otherwise successful agent run feel unreliable.

The fix changes final reply ownership so OpenClaw can supersede stale deferred text while preserving valid completed answers, media, and attachments.

## What Changed

The reply-delivery owner now reconciles deferred assistant streams, partial streams, and block replies before release. It records which message blocks belong to tool continuations, including normal-stop tails of asynchronous responses, and supersedes older text from those continuation blocks.

That distinction is important. OpenClaw is not simply deleting old conversation history. Completed answers to earlier user inputs remain intact, and the PR says media, attachment trust, provenance, reasoning, commentary, and rejected-media recovery keep their existing ownership.

The finalization hook still gates delivery. The change focuses on deciding what text is obsolete before the deferred response is released to the user.

## Why It Matters

Tool-heavy agent conversations often evolve in stages. A model may start with a partial answer, run tools, revise its understanding, and then deliver a final response after hooks, media handling, or channel-specific delivery checks.

When an earlier deferred answer leaks out after the final answer, the transcript contradicts itself. Users have to guess which response is current, and automations that depend on final-answer ownership can see unnecessary noise.

This PR makes the delivery layer more deliberate about tool continuations. The accepted final answer can remain the final answer, while stale intermediate text is quietly superseded.

## User Impact

The visible change should be calmer endings to tool-using conversations. Users should no longer receive a burst of obsolete intermediate replies after the accepted final answer or terminal `NO_REPLY`.

The PR also calls out several preservation guarantees:

- Valid media and attachments remain attached.
- Completed earlier answers stay in the transcript.
- Final text is not truncated when it extends an earlier deferred prefix.
- No new settings, provider branches, or storage changes are introduced.

That combination matters because reply cleanup is risky if it drops legitimate content. The patch is explicitly about stale continuation text, not broad transcript pruning.

## Validation

The evidence is unusually detailed. The PR reports that eight new behavior regressions failed on original production code, while a preservation control for completed earlier answers already passed. The candidate then passed all nine cases.

OpenClaw also reports 982 tests across 39 files, covering subscriber behavior, canonical final payloads, the asynchronous agent loop, Responses replay, and steering continuation. Required changed-file checks passed, including formatting, type graphs, lint, dead exports, plugin boundaries, runtime import cycles, and repository guards.

For users, the result is simple: OpenClaw should stop replaying obsolete tool-turn answers after it already knows which response won.
