---
title: "OpenClaw Protects Active Transcripts"
excerpt: "OpenClaw now defers stale-session rollover when an active run owns the same session, preventing split transcript output."
coverImage: '/assets/images/posts/openclaw-2026-6-27-active-transcript-rollover.png'
date: '2026-06-27T08:03:00.000Z'
dateFormatted: June 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-27-active-transcript-rollover.png'
---

OpenClaw merged [PR #97164, "fix: prevent daily rollover splitting active transcripts"](https://github.com/openclaw/openclaw/pull/97164), a P1 session-state fix for active agent runs that cross a stale-session reset boundary.

The bug affected a narrow but painful timing window. If an inbound message arrived just after a configured daily or idle reset boundary while the previous turn was still running, stale-session rollover could archive the active transcript before reply-turn admission had a chance to wait, queue, or steer correctly.

The active writer could then recreate the old transcript path, while later output landed elsewhere. The result was a split transcript and potentially orphaned output from a run that was still in progress.

## What Changed

The new logic defers implicit daily or idle rollover when the reply run registry shows the same session key and session id already has a non-queued active operation.

That scope is intentionally tight. Normal stale-session cleanup still works when no run owns the session. Queued pre-dispatch reservations still allow ordinary rollover, and if rollover creates a new session, the queued reservation is rebound to the new session id before the run starts.

Explicit `/new` and `/reset` behavior is unchanged.

## Why It Matters

OpenClaw transcripts are not just logs. They are the durable record that helps agents resume context, operators audit behavior, and channel replies stay explainable after a long-running turn.

When a transcript splits mid-run, the user-facing symptom can be confusing: output appears incomplete, later tool activity seems detached from the initiating prompt, or follow-up context lands in the wrong place. For long-running automated tasks, that can make a successful run look lost.

PR #97164 makes reset-boundary behavior respect active ownership. If a run is still writing to a session, rollover waits instead of archiving the ground underneath it.

## Active Runs Versus Queued Work

The distinction between running work and queued pre-dispatch work is important. The patch does not freeze all rollover behavior just because a future run has been reserved.

Instead, it checks whether the same session has a non-queued active operation. That gives OpenClaw the behavior operators actually want:

- Do not split the transcript of a running turn.
- Do keep ordinary stale-session cleanup available when the current inbound turn has not started yet.
- Do rebind queued work to the new session id when rollover legitimately creates one.

That keeps the stale-session feature useful without letting it interrupt live output.

## Validation

The PR includes focused tests for session handling, media-only reply runs, reply-turn admission, Gateway session reset hooks, and Gateway reset cleanup.

It also includes current-commit Crabbox proof using a stale daily-reset session with a running `replyRunRegistry` operation for the same session id. The observed result was `isNewSession:false`, `resetTriggered:false`, no archive files, and all transcript markers staying in one file.

An autoreview pass initially found issues around queued pre-dispatch reservations, which were fixed before merge. The final autoreview run exited clean.

For OpenClaw users, this is a reliability polish with real operational weight. Long-running turns can cross daily or idle boundaries without having their transcript split out from under them.
