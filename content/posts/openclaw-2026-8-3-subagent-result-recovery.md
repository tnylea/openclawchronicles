---
title: "OpenClaw Keeps Subagent Results Recoverable"
excerpt: "OpenClaw PR #118360 keeps successful subagent results recoverable when final delivery is delayed, ambiguous, or blocked."
coverImage: '/assets/images/posts/openclaw-2026-8-3-subagent-result-recovery.png'
date: '2026-08-03T08:02:00.000Z'
dateFormatted: August 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-3-subagent-result-recovery.png'
---

OpenClaw merged [PR #118360, "fix(agents): preserve subagent results when delivery fails"](https://github.com/openclaw/openclaw/pull/118360), a P1 fix across the agent runtime, Gateway, CLI, web UI, Android app, and task surfaces.

The problem was not that a child agent failed. It was worse in a quieter way: a successful subagent could finish its work, then lose or strand the result while trying to deliver it back to the requester.

The PR says delivery could stop after three attempts even though the documented recovery window was still open. Restart settlement could also race queued results, and operators did not have a safe way to inspect or recover a blocked completion.

## One Owner For Completion Delivery

The fix gives completion delivery one durable owner across SQLite-backed subagent, task, and session-queue records. Execution success is now tracked separately from delivery state, so a completed child run does not become a failed run just because the final handoff is delayed.

Retries remain bounded by the hard-expiry window, and startup recovery, scheduled delivery, and targeted recovery now use the same settlement path. That matters for operators because recovery behavior should not depend on whether the Gateway restarted, a queue settled late, or a result needed manual attention.

The PR also adds retained blocked results. These results are kept for seven days and can be retried or dismissed through additive `operator.write` Gateway methods, CLI commands, and the Tasks UI.

## User Impact

Successful child execution now remains successful even when delivery is blocked. Operators can inspect retained results, copy them, retry delivery with a duplicate-risk warning, or dismiss the blocked item without losing the underlying output.

The recovery guardrails are explicit:

- blocked completions are retained for seven days
- OpenClaw warns when 25 blocked completions are retained
- new subagent spawns pause at 50 retained completions
- retained generations are capped by default
- legacy retained-result rows are normalized automatically on database open

The PR notes that useful fallback output is preserved across restart, retry, dismissal, queue recovery, and collector waits. It also preserves the distinction between visible terminal replies and intentionally silent terminal replies, so recovery does not accidentally expose text from a silent child run.

## Evidence

The PR includes exact-head CI evidence at commit `129ff55e57060eb9e875ce2a85810604f10e2127`: 73 successful jobs, five skipped jobs, and zero failures.

It also links a restart and recovery proof using production SQLite stores, two reload cycles, canonical visible and silent selection, and exported `tasks.retry` and `tasks.dismiss` Gateway handlers. That proof shows visible results survive retry, silent results remain absent through retry and dismissal, and generation state persists across a second restart.

Focused verification covered 454 tests across completion selection, state migration, SQLite persistence, completion admission, announcement delivery, registry lifecycle, timeout handling, and format E2E.

This is a strong reliability change for anyone using OpenClaw's multi-agent workflows. Child agents can do the work, but the parent session still needs a trustworthy path to receive, recover, and audit the result.
