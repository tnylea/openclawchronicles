---
title: "OpenClaw Fixes Premature Session Compaction"
excerpt: "OpenClaw PR #120497 adds provenance to context-size facts so sessions stop compacting early from inflated multi-loop token totals."
coverImage: '/assets/images/posts/openclaw-2026-8-8-context-size-provenance.png'
date: '2026-08-08T08:03:00.000Z'
dateFormatted: August 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-8-context-size-provenance.png'
---

OpenClaw merged [PR #120497, "fix(sessions): require provenance for fresh context-size facts"](https://github.com/openclaw/openclaw/pull/120497), a large session reliability fix for premature compaction.

The bug was costly: cumulative multi-tool-loop usage could inflate `sessionEntry.totalTokens`, making compaction fire when a session was only 4-8% into its configured context window. The PR describes a reported 1M-token session that went from 285,908 tokens to 192,899, then to 125,487 after unnecessary compactions, losing roughly 160K tokens of usable conversation context.

## The Root Cause

OpenClaw intentionally accumulates multi-loop usage for billing, but one persistence path treated that cumulative number as if it were a fresh context-size snapshot. When an authoritative last-call snapshot was absent, the old `usageIsContextSnapshot` escape hatch could promote the accumulated usage into `totalTokens`.

That made status and memory behavior drift away from reality. `/status` could show 100% mid-turn, memory flush could be bypassed, and compaction could summarize and discard conversation long before the model context was actually full.

The problem had already survived an earlier guard, shipped in the 2026.7.1-2 line, because that fix addressed a narrower aborted-call case without removing the unsafe promotion path.

## What The Fix Does

PR #120497 makes context-size facts carry provenance instead of relying on a trust-by-flag shortcut. Only a versioned final-call snapshot, explicit prompt tokens, transcript-derived data, or a post-compaction snapshot can mark totals fresh.

The PR also rejects already-corrupted legacy "fresh" totals when they lack provenance, before the first post-upgrade compaction can act on them. That is a conservative choice: legacy totals may temporarily display as unknown or transcript-estimated, but OpenClaw avoids another destructive compaction.

Unavailable-context barriers now propagate through AgentCore, memory flush, JSONL, SQLite and Gateway paths, retries, checkpoints, forks, status, goals, subagent displays, and Codex startup. In other words, the runtime surfaces agree on one trusted context-size fact instead of each recovering differently.

## Why It Matters

Compaction is supposed to preserve long-running sessions, not erase them early. When a coding agent, research agent, or personal assistant loses context too soon, users feel it immediately: repeated questions, forgotten constraints, and summaries replacing active working memory.

This fix should make OpenClaw compaction less eager and more honest. Sessions compact when context is actually large, while uncertain totals stay uncertain until a trusted snapshot arrives.

## Validation

The PR reports a broad suite matrix after rebase: runner integration, memory and preflight, AgentCore compaction, JSONL, SQLite and Gateway, Codex startup, server compaction, plus status and checkpoint conformance suites. The combined focused count listed in the PR is 447 tests, alongside type gates, dead-code scans, clean diff checks, and two clean Codex autoreview passes.

For heavy OpenClaw users, PR #120497 is one of those invisible fixes that can save real work. The best compaction event is the one that happens at the right time.
