---
title: "OpenClaw Fixes Context Engine Compaction"
excerpt: "OpenClaw PR #95342 prevents false context-overflow failures when external context engines already own compaction."
coverImage: '/assets/images/posts/openclaw-2026-6-30-context-engine-compaction.png'
date: '2026-06-30T08:00:00.000Z'
dateFormatted: June 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-30-context-engine-compaction.png'
---

OpenClaw merged [PR #95342](https://github.com/openclaw/openclaw/pull/95342) this morning to fix a context-overflow edge case that hit sessions using context engines such as `lossless-claw`.

The issue was not that the model was actually out of room. According to the PR, the built-in pre-prompt overflow check could overestimate CJK-heavy tool-result content by roughly 2.5x. In one before-fix example, the model's actual usage was 85,643 tokens out of a 128,000-token context window, while the precheck estimated about 122,000 tokens and stopped the turn.

For users, that showed up as a frustrating failure: "Auto-compaction could not recover this turn," even though the active context engine was already managing its own budget.

## What Changed

The fix is narrowly scoped. When an active context engine declares `ownsCompaction: true`, OpenClaw now skips the pre-prompt preemptive overflow check.

That matters because these engines already own the lifecycle that the precheck was trying to protect:

- They budget context inside their own assembly flow.
- They own when compaction happens.
- They can compact after turns before the prompt grows too large.
- Real model overflow errors still fall back to the outer overflow-compaction retry loop.

In other words, OpenClaw is no longer second-guessing a context engine that has explicitly taken responsibility for compaction.

## Why This Is A Reliability Fix

Context engines are one of the more important directions for long-running OpenClaw sessions. They let operators experiment with different memory, pruning, and prompt assembly strategies without forcing every agent into the same built-in compaction behavior.

That flexibility only works if OpenClaw respects the contract. A context engine that says it owns compaction should not be blocked by a separate rough estimator before the engine's own strategy has a chance to work.

The PR keeps the safety net in place for real overflow. If the model API actually rejects the prompt for exceeding context, the outer retry loop can still recover through compaction. What disappears is the false-positive precheck for engines that already manage this path.

## Evidence In The PR

The PR includes a regression test covering the exact contract: an `ownsCompaction` context engine skips the precheck, then still recovers from a real model overflow through the existing retry path.

It also adds an observability breadcrumb. When the skip path is used, OpenClaw logs that the context-overflow precheck was skipped because the context engine owns compaction. That should make future debugging clearer for operators and plugin authors.

The compatibility story is intentionally small. Sessions without a context engine are unchanged. Sessions with a context engine that does not set `ownsCompaction: true` are also unchanged.

## The Bigger Pattern

This is the kind of fix that makes OpenClaw feel less brittle as the ecosystem grows. The project already has first-party agent runtime behavior, external plugins, context engines, provider adapters, and channel-specific delivery paths. Each extension point needs a clear ownership boundary.

PR #95342 tightens one of those boundaries. When a context engine owns compaction, OpenClaw now lets it own compaction.
