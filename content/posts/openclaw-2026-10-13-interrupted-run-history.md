---
title: "OpenClaw Shows Interrupted Runs More Clearly"
excerpt: "OpenClaw PR #170705 restores commentary, activity groups, and an Interrupted state when a restarted run has no final assistant reply."
coverImage: '/assets/images/posts/openclaw-2026-10-13-interrupted-run-history.png'
date: '2026-10-13T08:15:00.000Z'
dateFormatted: October 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-13-interrupted-run-history.png'
---

OpenClaw merged [PR #170705](https://github.com/openclaw/openclaw/pull/170705), a Control UI fix for a confusing transcript state after a Gateway restart interrupts a run between tool iterations.

Before the fix, an interrupted run could appear as a user message followed by one collapsed activity line. If tool display was off, it could look like there was no visible assistant-side activity at all. That hid saved commentary and made the run feel like it had silently vanished.

The new behavior keeps the useful history visible: commentary appears inline, tool activity groups remain available, and the run can show an `Interrupted` state when there is no terminal assistant reply.

## What Changed

The core issue was classification. The chat normalizer treated any row containing a tool call as a tool row, even if that assistant row also carried narration. Grouping then folded the narration into a collapsed tool disclosure. With tools hidden, the thread builder skipped those rows entirely.

PR #170705 separates narration from mixed assistant/tool rows so it can stay visible in assistant groups. It also marks an inactive run as interrupted when its last assistant row is a `toolUse` row and there is no terminal row.

The fix is presentation-only. The PR explicitly says transcript persistence and restart recovery are handled separately in other PRs. That distinction matters: this patch is about making already-saved history understandable in the UI.

## Why It Matters

Agent systems need good failure presentation. A run that was interrupted by a restart should not look empty, complete, or mysterious. Users need to know what happened, what was already said, and what activity was in progress.

This is especially important when tool calls are hidden. Hiding tool details should reduce noise, not erase the only visible evidence that the assistant had started work.

By preserving commentary and showing an interrupted state, the Control UI gives the user enough context to decide what to do next. They can continue, rerun, inspect activity, or simply understand why a final answer never appeared.

## Verification

The PR includes a synthetic fixture shaped like production history: a user turn, tool rows, two commentary rows, and no terminal assistant row. Before the fix, commentary was missing. After the fix, commentary, activity, and the interrupted state survive reloads.

Reported verification includes:

- A transcript-render regression covering both tool-shown and tool-hidden modes.
- A mocked-Gateway end-to-end test where commentary, activity, and `Interrupted` survive reload.
- 165 chat transcript, agent-run grouping, thread grouping, and thread tests passing.
- UI typechecks, changed-file lint, format checks, and `git diff --check` passing.

## Bottom Line

PR #170705 makes interrupted agent history honest again. When a Gateway restart cuts a run short before a final assistant reply, OpenClaw can now show the commentary it already saved, keep the related activity accessible, and label the run as interrupted.

That is a small presentation fix with a big trust payoff: the UI no longer hides the trail just when users most need it.
