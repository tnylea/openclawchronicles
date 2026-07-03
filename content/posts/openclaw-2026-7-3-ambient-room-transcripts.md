---
title: "OpenClaw Ambient Groups Now Persist Chat Memory"
excerpt: "OpenClaw ambient group mode now persists room events as transcript rows, helping agents remember older chat while cutting repeated prompt cost."
coverImage: '/assets/images/posts/openclaw-2026-7-3-ambient-room-transcripts.png'
date: '2026-07-03T08:03:00.000Z'
dateFormatted: July 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-3-ambient-room-transcripts.png'
---

OpenClaw merged [PR #99306, "feat(auto-reply): persist ambient room events as transcript rows"](https://github.com/openclaw/openclaw/pull/99306), a significant change for agents that quietly observe Telegram group rooms and decide when to speak.

The issue was straightforward: in ambient group mode, the agent could evaluate every unmentioned room message, but it was forced to forget those messages afterward. The PR says group knowledge lived only in a bounded per-turn chat window, with a default size of 50 messages, rebuilt into the uncached prompt tail on every turn.

Messages older than that window were not persisted, so compaction could not summarize them and future turns could not recover them.

## What Changed

Ambient room events now become durable session transcript rows. Each observed room event persists as one user-role row in the same attributed shape used for the current event display line, such as `#id sender: body`.

The row is intentionally plain. The PR says there is no metadata prefix, no window snapshot, and no assistant row when the turn remains silent. Coalesced room events can persist one row containing each observed message as its own attributed line.

That makes the transcript the durable group chat log, not just a record of messages the agent answered.

## The Watermark Invariant

The core of the change is a per-chat ambient watermark. It advances only after the transcript row is durably persisted, using a timestamp-first ordering with message ID as the tiebreaker.

Prompt-facing consumers of raw group history then exclude messages at or before the watermark. That includes group-history entries, cache-derived chat windows, room-event inbound history, and recovered-thread paths.

The goal is to prevent duplication. Once a message is owned by the transcript, the old raw-window path should stop injecting it again. The PR notes one intentional exception: explicit reply targets remain visible even if transcript-owned, so the model never sees a reply without the quoted context.

## Why It Matters

Ambient group mode is valuable because the agent can observe without interrupting. But observation is much less useful if the agent loses older context or repeatedly pays for the same message window.

With transcript persistence, older room context can participate in normal compaction. That gives the agent a path to retain the gist of group conversations beyond the short raw window.

The token economics also improve. The PR describes the net effect as each group message costing its tokens once, then becoming prompt-cache-hit on later turns instead of being rebuilt into the uncached tail every time.

## Scope and Behavior

This is a cutover for ambient mode, not a new setting. Mention-only mode is untouched because the persist hook is wired only for room events.

Silent turns remain silent. The change removes the room-event user-suppression special casing that prevented persistence, but it still suppresses transcript-only assistant rows when the agent chooses not to respond.

Core owns the watermark, while the channel reads it through the documented plugin SDK session-store runtime. That keeps the transcript boundary channel-agnostic instead of making Telegram invent its own memory layer.

## Evidence

The PR reports regression coverage for row shape, silent-turn assistant suppression, watermark advancement, dedupe boundaries, consecutive user rows, CLI session reseed, embedded replay, and `strip-inbound-meta` pass-through.

It also notes two autoreview rounds that found raw-window watermark bypasses; both were fixed and covered with regression tests that assert against final assembled prompt text.

## Bottom Line

PR #99306 gives ambient group agents a more durable memory contract.

OpenClaw can now observe group chat, persist the observed messages as transcript rows, compact them later, and avoid repeatedly feeding already-owned room history back into each new prompt.
