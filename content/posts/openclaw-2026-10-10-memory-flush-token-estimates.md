---
title: "OpenClaw Memory Flushes Now Use Token Estimates"
excerpt: "OpenClaw PR #83178 lets memory checkpoints run for local and compatible model servers even when provider usage metadata is missing."
coverImage: '/assets/images/posts/openclaw-2026-10-10-memory-flush-token-estimates.png'
date: '2026-10-10T23:03:00.000Z'
dateFormatted: October 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-10-memory-flush-token-estimates.png'
---

OpenClaw merged [PR #83178](https://github.com/openclaw/openclaw/pull/83178), a memory-flush fix for model servers that omit token usage metadata.

Before this change, pre-compaction memory checkpoints could be skipped when a provider reported missing or zero usage, even when transcript-based compaction already knew the session was under context pressure. That was especially relevant for local and OpenAI-compatible model servers, where usage accounting is less consistent than hosted APIs.

## What Changed

Memory flushing now shares OpenClaw's existing transcript estimator with compaction. When provider usage is unavailable, the memory checkpoint can use transcript-estimated pressure to decide whether it should run.

The PR is careful about what gets persisted. Estimated pressure can trigger the checkpoint, but it does not overwrite provider-reported session status. Only provider-anchored totals are persisted as fresh usage. The estimate stays transient and scoped to the decision that needs it.

The implementation also reuses the transcript reader's already-read accounting snapshot, keeps read fences and cancellation behavior intact, and counts assistant output once through the shared projection path.

## Why It Matters

Memory checkpoints are most useful when a conversation is approaching compaction pressure. If a local model server omits usage metadata, OpenClaw should not have to choose between pretending pressure is unknown and skipping useful memory work.

This fix makes memory behavior more provider-tolerant without turning estimates into fake authoritative usage. That distinction is important. Operators still see honest usage freshness, while the runtime gets enough signal to preserve memory before the context window gets tight.

The practical effect is strongest for:

- Local Ollama-style setups routed through compatible adapters.
- Model servers that return zero or missing usage fields.
- Sessions with long transcripts and small context windows.
- Users relying on memory checkpoints before auto-compaction.

## Real Local-Model Proof

The PR includes an isolated Gateway proof using Ollama `qwen2.5:7b` through an OpenAI-compatible loopback adapter that deliberately removed response usage metadata.

Two synthetic chat inputs were run before and after the fix. The first turn returned normally. The second reached compaction pressure with an estimated 21,719 tokens against a 6,144-token memory-flush threshold.

Before the fix, the memory flush had no token count and skipped. After the fix, OpenClaw used the transcript estimate, dispatched a real Qwen maintenance turn, completed the checkpoint in 7.06 seconds, and persisted a successful memory-flush marker. The source sessions still retained `totalTokens: 0` and `totalTokensFresh: false`, preserving the distinction between estimated pressure and provider-reported usage.

The oversized second chat still hit the same independent context-overflow failure on both versions, but the repaired memory checkpoint completed before that failure.

## Bottom Line

PR #83178 gives OpenClaw a better fallback when providers do not report token usage. Memory checkpoints can now fire based on transcript pressure, while session status stays honest about whether usage came from the provider.
