---
title: "OpenClaw Fixes Workspace Tools After Continuations"
excerpt: "OpenClaw PR #170791 fixes workspace tools after session continuation so resumed turns can keep using prepared project files without weakening stale-tool checks."
coverImage: '/assets/images/posts/openclaw-2026-10-13-workspace-tools-continuations.png'
date: '2026-10-13T08:05:00.000Z'
dateFormatted: October 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-13-workspace-tools-continuations.png'
---

OpenClaw merged [PR #170791](https://github.com/openclaw/openclaw/pull/170791) this morning to fix a sharp reliability bug in resumed sessions: workspace tools could fail with `Session changed while preparing its project` after a child result or other internal continuation.

That sounds narrow, but it lands in a very real workflow. If an agent resumes after delegated work, the user still expects the prepared project workspace to be available. Before this fix, the resumed turn could inherit an expired workspace-readiness context from the previous chat run. The result was a tool surface that looked prepared but refused to operate when the agent tried to read or use project files.

## What Changed

The PR changes how autonomous runs and chat dispatch handle workspace-readiness context:

- Autonomous runs now start without inheriting the previous run's expired readiness context.
- Chat dispatch installs its own context even when no new preparation is pending.
- Existing stale-tool safety checks remain enforced.
- Existing cancellation and workspace-preparation behavior remain in place.

The user-facing version is simpler: continuing a session after internal work should no longer break the workspace tools that the session is supposed to have.

## Why This Matters

OpenClaw leans heavily on continuation. Parent sessions hand work to child sessions, agent runs resume after internal events, and a lot of useful automation depends on keeping those boundaries crisp. A continuation bug in workspace preparation is easy to miss in happy-path testing because the original workspace setup may have succeeded.

The important part of PR #170791 is that it does not solve the problem by relaxing stale-tool checks. The PR body says old retained tools remain denied, and the new regression tests use real host-bound filesystem reads to verify that the fresh continuation works while stale access still fails.

That is the right shape for this class of bug. The fix restores legitimate continuity without widening the authority of old tool handles.

## Verification

The PR reports a direct reproduction of the error after a child-result continuation. Both new successor-boundary regressions failed before the patch and passed after it.

The focused evidence includes:

- 32 Gateway tests passing.
- 16 existing workspace-readiness safety tests passing.
- Targeted typecheck, lint, formatting, and diff checks passing.
- An independent review with no actionable P0-P2 findings.

The PR also notes one unrelated product fixture that did not reach its early-prompt precondition, so the author does not overclaim that scenario. That restraint is useful: the merged fix is specifically about continuation-owned workspace readiness, not every possible startup edge case.

## Bottom Line

PR #170791 is a small Gateway fix with a concrete quality-of-life effect. If a session resumes after child work or another internal continuation, OpenClaw should keep the prepared workspace usable for the right run and continue rejecting stale tool access from the wrong one.

That is exactly the kind of continuity polish that makes long-running agent work feel less brittle.
