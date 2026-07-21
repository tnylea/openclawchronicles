---
title: "OpenClaw Keeps Compaction On The Live Model"
excerpt: "OpenClaw auto-compaction now follows live model switches, keeping provider credentials aligned during timeout and overflow recovery."
coverImage: '/assets/images/posts/openclaw-2026-7-21-live-model-compaction.png'
date: '2026-07-21T08:01:00.000Z'
dateFormatted: July 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-21-live-model-compaction.png'
---

OpenClaw merged a high-priority agent runtime fix this morning for sessions that switch models in the middle of long work. [PR #95713](https://github.com/openclaw/openclaw/pull/95713), titled "fix(agents): keep auto-compaction on the live session model," closes a subtle but important mismatch in the embedded agent runner.

The issue appeared after a user changed models with `/model`. The UI and normal follow-up turns would use the newly selected model, but auto-compaction could still fall back to the model that was active when the run started. In cross-provider switches, that also risked carrying the old provider's auth profile into compaction.

For users, the visible result could be confusing: the session looked like it had moved to the new model, but timeout or overflow recovery still behaved as though the original provider and credentials were in charge.

## What Changed

The fix reuses the live model selection that the run loop already resolves before deciding whether a restart is possible. When a pending live model switch falls through to compaction, OpenClaw now carries that prepared provider, model, and auth profile into the compaction runtime context.

The PR describes the behavior in four cases:

- A pending provider and model override now drives the compaction context.
- A pinned auth profile on a cross-provider switch is preserved.
- A cross-provider switch without a pinned profile drops the stale old-provider profile.
- A session with no pending switch keeps the original provider, model, and profile behavior.

That last point is important. This is not a broad rewrite of compaction or session model selection. It is a targeted correction for the handoff between live model switching and recovery compaction.

## Why It Matters

Auto-compaction is one of the places where users most need OpenClaw to preserve intent. It runs when a session is under pressure: timeout handling, overflow recovery, and long-running contexts. If that path silently uses a stale provider or credential profile, the session can become harder to reason about exactly when reliability matters most.

The merged patch keeps the session's visible model choice and recovery behavior aligned. After a `/model` switch, compaction should use the model the user selected and resolve credentials for that provider instead of pairing the new provider with the previous provider's profile.

It also preserves the agent hot path. The change does not add a fresh store read at compaction time; it carries forward the selection the loop had already prepared.

## Proof From The PR

The PR was labeled P1, `agents`, `proof: sufficient`, and `merge-risk: auth-provider`, which signals both user impact and sensitivity around provider routing. The author reports a focused regression test in `src/agents/embedded-agent-runner/compaction-live-model-override.test.ts` using the same boundary as the existing live model switch tests.

The test evidence proves OpenClaw now resolves compaction to the selected provider and model after a persisted override, preserves a pinned profile when supplied, avoids reusing a stale profile across providers, and leaves no-switch behavior unchanged.

Validation included `node scripts/run-vitest.mjs src/agents/embedded-agent-runner/compaction-live-model-override.test.ts`, type-aware `oxlint`, and formatting. The remaining caveat is that the PR did not include a full live multi-provider Gateway session with real timeout or overflow compaction, but it does exercise the exact composition used by both compaction sites.
