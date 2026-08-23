---
title: "OpenClaw Repairs Code Mode Preflight Failures"
excerpt: "OpenClaw Code Mode can now offer one safe correction after proven nested tool preflight rejection, without retrying side-effecting calls."
coverImage: '/assets/images/posts/openclaw-2026-8-23-code-mode-preflight-repair.png'
date: '2026-08-23T08:02:00.000Z'
dateFormatted: August 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-23-code-mode-preflight-repair.png'
---

OpenClaw merged a Code Mode reliability fix in [PR #128054](https://github.com/openclaw/openclaw/pull/128054): nested tool calls that fail before target execution starts can now get one safe correction attempt instead of terminating the Code Mode flow.

The key phrase is "before target execution starts." OpenClaw is careful about retries because a failed tool call might still have changed something. A retry after a partially executed operation can duplicate work, corrupt state, or hide the real failure. But a proven preflight rejection is different: no target operation ran.

This PR teaches Code Mode to recognize that boundary more accurately.

## What Changed

The fix uses OpenClaw's existing two-phase tool preparation boundary. Nested execution now carries host-private no-start provenance through bridge settlement, so Code Mode can tell when a rejection happened during preparation rather than after the implementation began.

That lets Code Mode offer one correction attempt after a proven preflight rejection. The PR explicitly keeps repair disabled for outcomes that are not safe to retry, including successful, mixed, unknown, forged, cancelled, waiting, or post-start results.

The change also handles stale `exec.timeout` input during preparation. Direct exec callers keep the same validation contract, while Code Mode requests wrapping only for tools that declare preparation support.

In plain terms: if the nested tool rejected stale or invalid input before it touched the target system, Code Mode can ask for a corrected call. If the tool might have started real work, the old no-retry protection still applies.

## Why It Matters

Code Mode often chains tools through nested execution. When an argument is stale or malformed, the best user experience is usually a quick correction, not a hard stop. But the runtime has to earn that correction path by proving the failed operation had no side effects.

[PR #128054](https://github.com/openclaw/openclaw/pull/128054) improves that proof boundary. It does not broadly retry failed tool calls. It creates a narrow repair lane for rejected preflight inputs where the target operation never started.

That should make Code Mode more resilient during long coding sessions, especially when a nested call depends on runtime-owned validation such as timeout values, session state, or prepared tool metadata.

## Safety Boundary

The safety posture is the important part of the story. The PR description says the previous behavior classified stale `exec.timeout` as a side-effecting bridge failure, and the target execution was entered before rejection. After the repair, stale timeout input is rejected during preparation.

That flips the situation from "maybe the bridge started something" to "the target did not start." Only the second case is eligible for a Code Mode repair attempt.

The one-shot limit is also important. Even for no-start failures, Code Mode gets a correction chance, not an unbounded retry loop.

## Validation

The PR reports a reproduction on current `main` where stale `exec.timeout` entered target execution and was classified as a side-effecting bridge failure. It then reports 700 passing Blacksmith Testbox tests across Code Mode guest, wait, bridge, preflight repair, headless, embedded lifecycle, repair-hook, and exec timeout suites.

The changed-file gate passed core and core-test checks, and a fresh autoreview reported no accepted or actionable findings.

## Bottom Line

OpenClaw Code Mode now has a sharper distinction between "bad input rejected before anything ran" and "a tool call may have had effects." That gives users a useful correction path without weakening the guardrails around side-effecting execution.
