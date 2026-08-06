---
title: "OpenClaw Keeps Generated Media Alive"
excerpt: "OpenClaw PR #119764 keeps generated images, audio, and video alive while long-running Gateway chat turns are still active."
coverImage: '/assets/images/posts/openclaw-2026-8-6-generated-media-retention.png'
date: '2026-08-06T08:02:00.000Z'
dateFormatted: August 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-6-generated-media-retention.png'
---

OpenClaw merged [PR #119764, "fix(gateway): keep uncommitted generated media while its session run is live"](https://github.com/openclaw/openclaw/pull/119764), a P1 Gateway fix for long-running media replies.

The failure mode was easy to miss until a turn ran longer than expected. Generated assistant media, including images, audio, and video, starts life as a managed outgoing media record with no committed transcript message yet. It is marked transient until finalization attaches it to the assistant message.

OpenClaw's cleanup path treated transient media as old-orphan data after a 15 minute TTL. That works for abandoned records, but it breaks when the assistant turn is still alive. Slow generation, queued work, delayed provider responses, or blocked finalization could keep a legitimate media record uncommitted past the TTL.

The result was a bad user-facing artifact: the transcript message could finalize with a media URL that was already dead.

## Active Runs Now Own Retention

PR #119764 adds a live-session-run check to the managed outgoing media cleanup path. When a transient media record belongs to a session that still has a registered chat run, OpenClaw skips the age-based reap.

That changes the meaning of transient media from "old enough to delete" to "old enough to delete only if no active run still owns it." The TTL still helps clean abandoned records, but it no longer wins over an in-flight assistant turn.

The fix also tightens finalization. Attaching managed outgoing media to a message can no longer silently ignore a failed persistence result. If cleanup or another state race has already removed the record, finalization has evidence instead of committing a broken attachment as if everything worked.

## Why This Matters

Media generation often takes longer than a plain text answer. A high-quality image, long audio response, or queued video job can cross arbitrary timing boundaries that normal chat replies never touch.

For users, the difference is visible. Without this fix, the assistant might appear to complete successfully while the linked media cannot load. With the fix, OpenClaw keeps generated media alive for the lifetime of the run that produced it.

This is especially important for browser clients because the cleanup path can be triggered by ordinary chat history access and by Gateway maintenance. A user opening the conversation while generation is still in progress should not accidentally help sweep away the output they are waiting for.

## Evidence

The PR documents the root cause in `src/gateway/managed-image-attachments.ts`: transient cleanup considered record age but had no active-run probe. The repaired path accepts a `hasActiveSessionRun` check and preserves transient records while their session run is live.

The user impact is narrow and useful. OpenClaw should stop committing assistant messages with permanently dead media URLs caused by cleanup racing ahead of long-running generation or finalization.

