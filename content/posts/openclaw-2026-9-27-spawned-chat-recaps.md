---
title: "OpenClaw Fixes Recaps for Spawned Chats"
excerpt: "OpenClaw PR #159458 restores Activity recaps for visible spawned chats while preserving hidden-subagent and incognito exclusions."
coverImage: '/assets/images/posts/openclaw-2026-9-27-spawned-chat-recaps.png'
date: '2026-09-27T08:01:00.000Z'
dateFormatted: September 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-27-spawned-chat-recaps.png'
---

OpenClaw's Activity view picked up a targeted usability fix this morning. [PR #159458](https://github.com/openclaw/openclaw/pull/159458), titled `fix(activity): recaps fail for visible spawned chats`, fixes cases where Activity showed "Recap unavailable" for conversations that should have been eligible for summaries.

The bug was narrow but annoying. Visible conversations created by an agent could show a Retry button that could not succeed, because recap admission rejected sessions with a parent. Activity already had a distinction between visible spawned conversations and hidden subagents, but recap generation was not using that distinction correctly.

## What Changed

The merged patch reuses Activity's existing visibility classification at recap admission and around asynchronous model and storage work. That lets visible spawned dashboard chats and grouped conversations generate, refresh, and backfill recaps.

The fix also handles a tricky race. If a group change makes a spawned conversation hidden while recap work is pending, the Gateway now stops before calling the model or committing the recap. That keeps recap behavior aligned with access controls rather than generating stale or newly inappropriate summaries.

The PR says there is no migration or configuration change required.

## What Users Should Notice

For everyday OpenClaw users, the change should make Activity feel less arbitrary. A spawned chat that is still visible should no longer get stuck behind an unavailable recap state, and Retry should have a real path to success.

At the same time, the patch preserves exclusions that should stay excluded:

- Hidden background subagents
- Cron-created conversations
- Heartbeat conversations
- Incognito conversations
- Existing access-control boundaries

That balance is important. Recaps are useful only when they respect the same visibility rules as the conversations they summarize.

## Regression Coverage

The PR includes several focused checks. A registered-RPC regression now verifies spawned dashboard and grouped chats return an updating state instead of unavailable, then persist recaps alongside an ordinary chat. Whole-batch rejection is also tested before model work begins.

The follow-up race checks are useful too: delayed preparation should not call the model after visibility changes, and queued writes should not save a recap once the conversation has become hidden.

The merge notes report 51 focused passing cases across recap lifecycle, retry, and event suites. Hosted CI passed on commit `aaa9fda02006`, and ClawSweeper re-review found no remaining actionable findings.

## Why It Matters

Activity recaps are one of those small quality-of-life features that quietly shape trust. If a visible conversation cannot explain itself, users have to reopen the thread and reconstruct context manually. This fix brings spawned conversations back into the same recap flow as ordinary chats while keeping hidden work private.
