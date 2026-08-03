---
title: "OpenClaw Stops Subagent Events Leaking Into Chats"
excerpt: "OpenClaw PR #118296 prevents internal subagent completion events from leaking into user-visible chat replies."
coverImage: '/assets/images/posts/openclaw-2026-8-3-subagent-chat-leak-fix.png'
date: '2026-08-03T08:03:00.000Z'
dateFormatted: August 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-3-subagent-chat-leak-fix.png'
---

OpenClaw merged [PR #118296, "fix(agents): prevent internal subagent completion events from leaking into chats"](https://github.com/openclaw/openclaw/pull/118296), a P1 agent-runtime and message-delivery fix focused on the boundary between child-agent execution and user-visible replies.

The PR describes a lifecycle bug in registered subagents: OpenClaw could lose the producer's final reply classification at the handoff boundary. Intentional silence, genuinely empty output, and visible output could collapse into the same downstream state.

That ambiguity could create visible problems. The system might infer from transcripts, fabricate tool-count summaries, or send captured child text through an exceptional direct-delivery fallback without the normal completion path's sanitization and size bound.

## Producer-Owned Reply State

The fix records one producer-owned terminal reply snapshot while the authoritative raw result is still available. That snapshot carries a visible, silent, or empty disposition through lifecycle events, `agent.wait`, durable registry state, restart, and announcement.

The old flow relied too much on downstream inference. The new flow is clearer: producer snapshot, lifecycle event, wait or durable registry, then announcement.

The PR says OpenClaw now keeps reply evidence independent of timeout and cancellation precedence, uses transcript capture only for legacy missing evidence, suppresses only explicit silence, removes synthetic tool-count output, and sanitizes the exceptional direct fallback before transport.

## User Impact

Tool-using subagents now deliver their real final text instead of an invented summary. That is especially important when a child agent performs several tool calls and ends with a concise answer that should be shown exactly as written.

Intentional silence remains silent across embedded, CLI, and ACP execution. Genuinely empty completion is recorded as a no-output outcome rather than being mistaken for silence. Durable completion also behaves consistently after restart.

The direct fallback path is safer too. It no longer exposes protected internal metadata or unbounded captured text when the ordinary completion path cannot be used.

## Evidence

The PR includes exact-head QA proof at commit `f3d98a88dbafa5695ea301498f498d67cbd15e01`. The QA run used a qa-channel and QA Lab bus, an ephemeral Gateway child, a mock OpenAI provider, SQLite-backed task lifecycle, and the real Telegram channel plugin.

The linked artifact reports visible delivery at 1/1, silent delivery at 0/0, fallback delivery at 1/1, restart delivery at 1/1, and empty-result representation at 1/1. It also asserts that captured channel payloads exclude `NO_REPLY`, a protected metadata sentinel, and `BEGIN_OPENCLAW_INTERNAL_CONTEXT`.

The verification section reports exact-head CI with no failures, 426 focused lifecycle and announcement tests, 64 timeout-output refactor tests, 74 ACP rebase integration tests, a 232-test QA provider matrix, and a 47-test scenario-catalog matrix.

For OpenClaw operators, the headline is straightforward: subagent replies should be the child agent's intended output, not leaked internals, inferred summaries, or unsafe fallback text.
