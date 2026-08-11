---
title: "OpenClaw Prevents Restart Reply Replays"
excerpt: "OpenClaw Gateway recovery now avoids duplicate final replies after restarts by recording per-delivery custody before replaying pending output."
coverImage: '/assets/images/posts/openclaw-2026-8-11-final-delivery-replay-fix.png'
date: '2026-08-11T08:00:00.000Z'
dateFormatted: August 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-11-final-delivery-replay-fix.png'
---

OpenClaw merged a high-priority Gateway delivery fix this morning with [PR #121908](https://github.com/openclaw/openclaw/pull/121908). The change targets a subtle but painful restart edge case: a final assistant reply could be prepared, delivered to the user, and then replayed after Gateway recovery if the system restarted before delivery confirmation was durably settled.

The result was duplicate final answers in channels such as Discord or Telegram. That is more than a cosmetic problem. In agent systems, a final reply may summarize tool outcomes, report completion, or ask the user to make a decision. Replaying it after a restart can make the system look uncertain about what happened.

## What Changed

The PR records per-delivery custody for pending finals. Instead of treating every prepared final as replayable after a restart, OpenClaw now distinguishes between finals that are proven unsent and finals whose delivery evidence is ambiguous.

The new dispatcher flow claims custody before provider I/O, settles the marker as delivered after a confirmed send, restores it to prepared only when there is proof that no send happened, and marks ambiguous cases unknown. On recovery, OpenClaw replays only proven-unsent finals.

The most important user-facing behavior is the fail-closed path. If Gateway cannot prove whether a final reached the recipient, it shows a visible interruption instead of blindly replaying the message.

## Why It Matters

Reliable channel delivery is one of the core promises of OpenClaw. The system can survive restarts, durable queues, provider retries, and turn recovery, but each recovery path needs a clear owner for the question: did this message actually leave the machine?

PR #121908 tightens that answer by preserving the provider-owned custody contract. The platform-send callback remains available to channel transports, so Discord and Telegram can mark the moment immediately before wire I/O. That keeps the recovery layer from guessing based on stale prepared markers.

The PR also fixes four Discord and Telegram harness type errors that appeared when the earlier attempt was reverted. That matters because the bug lived exactly at the boundary between core recovery and channel transport behavior.

## Tested Scope

The merged proof covered the five CI failures that caused the earlier version to be reverted. The PR author reports green results for reply dispatch, before-deliver custody, queue integration, heartbeat acknowledgement callbacks, and test-type checks.

A larger grouped run covered reply recovery, outbound infrastructure, channel turns, main-session recovery, and the Telegram and Discord extensions. The patch is sizable, adding the custody state machine and fail-closed recovery paths rather than relying on a narrower replay guard.

## The Bigger Picture

OpenClaw has been steadily moving delivery and approval systems away from optimistic replay and toward explicit custody. That direction is healthy. Restarts should recover work, but they should not pretend that ambiguous external delivery is safe to repeat.

After PR #121908, Gateway recovery has a better answer for final replies: replay only what is proven unsent, and tell the user when proof is missing.

