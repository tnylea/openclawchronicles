---
title: "OpenClaw Speeds Up New Git Sessions"
excerpt: "OpenClaw new sessions now open promptly in Git workspaces while preserving accurate first-turn diffs and workspace safety."
coverImage: '/assets/images/posts/openclaw-2026-8-17-new-session-git-baseline.png'
date: '2026-08-17T23:02:00.000Z'
dateFormatted: August 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-17-new-session-git-baseline.png'
---

OpenClaw merged a high-priority Gateway and session-state fix in [PR #124796](https://github.com/openclaw/openclaw/pull/124796), changing how new sessions capture Git diff baselines.

The user-facing problem was latency. Control UI users starting a new session could sit on the New Session page while OpenClaw scanned and fingerprinted the workspace's existing Git changes. The PR notes that even a clean OpenClaw checkout could spend roughly 0.5 to 1.2 seconds in that baseline step, with larger or dirtier repositories taking longer.

## What Changed

New local session generations now commit a private, durable baseline-capture claim with the session row. That lets `sessions.create` acknowledge the first turn and navigate immediately without running Git in the create path.

The important part is where the safety boundary moved. OpenClaw can show the prompt while the baseline is still being captured, but write-capable agent execution must wait until the exact session-start baseline is settled.

The PR describes the new owner model as:

- one private baseline-capture claim per session generation
- exact session generation and lifecycle revision fencing
- single shared capture before write-capable execution
- stale-generation aborts instead of crossing into replacements
- reset-aware fresh capture IDs
- fail-closed behavior if baseline persistence fails
- private claim data removed from public and plugin projections

That design aims to keep the faster user experience without letting first-turn file writes disappear from `sessions.diff`.

## Why It Matters

Diff baselines are easy to underestimate until they are wrong. If OpenClaw captures a baseline too late, a file created by the first turn can look like it was already there. If it captures too early or stores a stale claim, resets and replacement sessions can misreport workspace state.

PR #124796 is a latency fix, but it is also a correctness fix. Pre-existing dirty files should remain filtered out of the session diff. Files created by the first turn should remain visible. Recovery turns should not skip the baseline owner just because the session was reset.

For daily use, the outcome is simple: new Control UI sessions should feel quicker in Git workspaces, and the diff view should still tell the truth.

## Safety Details

The first attempt to background the scan was rejected because it introduced a race. A fast first-turn file write could be absorbed into a delayed baseline and vanish from the diff. It also left background mutation work that could conflict with delete, reset, project, and worktree lifecycle operations.

The merged version centralizes the owner path instead. Capture completion is fenced by session generation, lifecycle revision, and a unique capture ID. Failed capture becomes a conservative terminal state that shows the full diff rather than pretending the baseline is clean.

## Evidence From The PR

The PR includes extensive regression proof. Focused suites covered baseline capture, writer claims, reset owner behavior, agent-command baseline handling, compaction coverage, and `sessions.diff`.

The live proof used a disposable loopback Gateway and the real Gateway-served Control UI. The browser observed `sessions.create` in 508 ms, the chat route in 469 ms, and the exact prompt visible in 864 ms while a forced baseline Git capture lasted 12,019 ms. The first-turn file was written only after baseline completion, and authenticated `sessions.diff` returned only the new first-turn file while filtering the pre-session dirty file.

That is the right shape for this kind of fix: faster navigation, but no hidden first-turn workspace changes.
