---
title: "OpenClaw Now Reports Discarded Process Output"
excerpt: "OpenClaw PR #120705 tells agents when process output was permanently discarded by retention caps instead of implying visible command logs are complete."
coverImage: '/assets/images/posts/openclaw-2026-8-8-discarded-process-output.png'
date: '2026-08-08T23:04:00.000Z'
dateFormatted: August 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-8-discarded-process-output.png'
---

OpenClaw merged [PR #120705, "fix(process): report output discarded by retention caps"](https://github.com/openclaw/openclaw/pull/120705), a P1 agent-runtime fix for command output reporting.

The issue was about honesty in process results. Foreground and background process output could appear complete even after earlier bytes had been permanently discarded by OpenClaw's per-session aggregate cap. That mattered because an agent reading the visible tail could assume it had the full log when the oldest part of the output was already gone.

The PR describes a specific edge case left after an earlier fix: when the configured aggregate cap was smaller than the fixed poll tail, comparing tail length to aggregate length could hide unrecoverable loss.

## The New Signal

PR #120705 changes the reporting logic to use the producer-recorded `totalOutputChars > aggregated.length` fact. That distinguishes permanent aggregate-cap loss from ordinary retained-tail omission.

Those are different conditions:

- Permanent aggregate-cap loss means earlier bytes are gone and cannot be paged back.
- Retained-tail omission means more output may still be available through `process log`.
- Both can happen together, and OpenClaw now reports both facts instead of collapsing them into one incomplete view.

Polls and logs append the permanent-loss warning independently from the existing paging guidance. Foreground exec results receive the same fact from their owning process session, keeping interactive and background command surfaces consistent.

## What Stays The Same

The PR does not change default retention, aggregate caps, process lifecycle, or log paging. It also leaves two intentionally compact notification surfaces alone: automatic completion wake summaries and Gateway approval follow-up outcomes.

That restraint is useful. The bug was not that OpenClaw retained too little output by default; it was that the projection could claim more completeness than it actually had. The fix narrows in on that contract.

## Why It Matters

Agents often make decisions from command output: test failures, build logs, deploy traces, and long-running scripts. If the visible output is only the end of a much larger stream, that needs to be obvious.

With this change, an agent can tell the difference between "go page the retained log" and "the earlier output is no longer recoverable." That should reduce false confidence in build or diagnostic summaries after noisy commands.

## Validation

The PR reports 76 focused Vitest cases across process polling, the bash process registry, and exec runtime behavior. Regression coverage includes a 1,000-character aggregate cap below the 2,000-character tail, plus a 3,000-character case where discarded output and retained-tail omission both occur.

The patch also passed formatting, `git diff --check`, and Codex autoreview with no accepted findings. It is a small production change, but it improves a high-leverage promise: OpenClaw should tell the agent when the evidence is incomplete.
