---
title: "OpenClaw Fixes Chat Transcript Deletion Loss"
excerpt: "OpenClaw now preserves unrelated Control UI chat transcripts when one session is deleted during an in-flight IndexedDB save."
coverImage: '/assets/images/posts/openclaw-2026-8-23-chat-transcript-delete-fix.png'
date: '2026-08-23T08:01:00.000Z'
dateFormatted: August 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-23-chat-transcript-delete-fix.png'
---

OpenClaw's Control UI received a high-priority data-preservation fix this morning. [PR #128109](https://github.com/openclaw/openclaw/pull/128109) prevents deleting one chat session from silently discarding another session's in-flight transcript save.

The bug was subtle because the affected conversation could still believe it had been cached. That meant background prefetch could skip recovery, and reopening the conversation later could show missing history.

For anyone who keeps multiple sessions open, that is exactly the kind of state bug that feels random: you delete one conversation, and a different conversation loses unsaved history.

## What Changed

The issue lived in the Control UI snapshot owner. Before the fix, a single-session deletion was treated like a whole-cache generation change. That broad invalidation could cancel unrelated queued IndexedDB writes after their pending state had already been removed.

The new behavior separates scoped deletes from full-cache resets. OpenClaw keeps the global generation fence for whole-cache clears, but uses per-session revisions for individual session writes, deletes, and metadata-index seeding.

That means:

- deleting session B no longer invalidates an unrelated pending write for session A;
- deleting the same session still removes its cached transcript;
- full Gateway or cache resets still clear every snapshot;
- stale metadata is fenced so it cannot reappear after a scoped delete.

This is a small production change, but the ownership detail matters. Transcript writes and metadata indexing are asynchronous, so both need scoped fences to avoid resurrecting deleted state or losing unrelated state.

## Why It Matters

Local transcript caching is part of the Control UI's reliability story. It makes recent conversations visible quickly, helps prefetch recover session history, and smooths over normal browser and Gateway timing.

When a cache owner gets its invalidation boundary wrong, the UI can make false promises. In this case, one session could lose its in-flight save while still presenting the state as persisted. That is worse than a visible write failure, because the user gets no clear recovery prompt.

[PR #128109](https://github.com/openclaw/openclaw/pull/128109) narrows the invalidation boundary to the session being deleted. The fix does not make deleted sessions linger, and it does not weaken full-cache cleanup. It simply stops one scoped operation from trampling another scoped operation.

## Operator Impact

Most users should notice this only as an absence of bad behavior. Deleting conversations in the Control UI should feel the same, but unrelated sessions should no longer lose pending transcript saves.

The change is especially relevant when the browser has multiple active sessions, when background prefetch is running, or when a transcript save is queued while another session is being removed.

## Validation

The PR reports a real IndexedDB-owner regression that fails on unchanged `main`: deleting session B while session A is flushing returns `null` for session A's expected transcript. A second regression proves the metadata side by showing a deleted session's `savedAt` value can reappear without the new scoped metadata fence.

After the fix, 24 focused snapshot-store, Gateway invalidation, and session-prefetch tests pass. The PR also reports a real installed Google Chrome proof against native browser IndexedDB, with unrelated transcript preservation, same-session deletion, and full-clear deletion all confirmed.

## Bottom Line

OpenClaw's Control UI now treats chat transcript deletes with the right scope. A session delete stays a session delete, not a cache-wide event that can erase unrelated unsaved history.
