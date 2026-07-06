---
title: "OpenClaw Saves Discord Attachments Earlier"
excerpt: "OpenClaw now downloads Discord attachments at receipt time, keeping queued media available even when earlier agent runs delay processing."
coverImage: '/assets/images/posts/openclaw-2026-7-6-discord-attachment-preflight.png'
date: '2026-07-06T23:04:00.000Z'
dateFormatted: July 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-6-discord-attachment-preflight.png'
---

OpenClaw merged [PR #96183, "fix(discord): download attachments at receipt time, not after the run queue"](https://github.com/openclaw/openclaw/pull/96183), a P1 Discord reliability fix for one of the most frustrating failure modes in busy agent channels: media that expires before the agent ever gets to process it.

The issue comes from Discord's signed attachment CDN URLs. Those URLs carry a fixed expiration time. If a message with an image, file, video, or forwarded attachment lands while OpenClaw is still working through an earlier request, the inbound run queue can delay processing long enough that the CDN URL is no longer usable.

The new behavior moves volatile media download work to the receipt boundary, before the queued agent job waits its turn.

## What Changed

The Discord extension now resolves direct and forwarded attachments during authorized preflight. It combines the downloaded media into a required `preparedMedia` array and serializes that immutable snapshot into the queued inbound job.

That means the job no longer depends on a later fetch against a short-lived CDN URL. By the time the agent run starts, the media has already been captured under OpenClaw's own queued job payload.

The change also keeps bot-loop suppression before CDN I/O. If a Discord message is rejected as repeated bot traffic, OpenClaw does not download media and does not put that message into the run queue.

## Why It Matters

Discord is often used as a shared command surface for OpenClaw. In that setup, attachments are not decoration. Screenshots, PDFs, logs, short videos, and forwarded files can be the entire task.

When media expires between receipt and processing, the agent sees a weaker version of the user's request, or no useful artifact at all. That is especially painful in group channels where multiple requests may queue behind a long-running job.

By downloading media immediately, OpenClaw treats Discord attachment URLs as transport-time material rather than durable storage. That is the right boundary for signed URLs: capture them while valid, then hand stable media references to the run queue.

## Validation

The PR reports a targeted Discord regression suite covering inbound delivery, forwarded attachments, bot-loop suppression, prepared media serialization, and queue processing.

The user-facing contract is narrow. Text-only messages keep their existing behavior. Attachment authorization checks remain in place. The main change is that media attached to a valid message survives queue delay instead of depending on Discord's CDN URL still being valid later.

## Bottom Line

OpenClaw now snapshots Discord attachments before an agent run waits in line. For operators who use Discord as a media-heavy command channel, this should make queued image, file, video, and forwarded-message tasks much more reliable.

