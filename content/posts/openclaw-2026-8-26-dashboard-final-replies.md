---
title: "OpenClaw Dashboard Replies Recover After Finals"
excerpt: "OpenClaw dashboard chats now refresh durable history when a completed run ends without carrying the final reply message."
coverImage: '/assets/images/posts/openclaw-2026-8-26-dashboard-final-replies.png'
date: '2026-08-26T23:02:00.000Z'
dateFormatted: August 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-26-dashboard-final-replies.png'
---

OpenClaw’s Control UI received a P1 dashboard reliability fix tonight for a confusing completion-state edge case: a dashboard chat could show a run as Done while the assistant’s durable reply was still missing from the visible transcript.

The fix landed in [PR #130417](https://github.com/openclaw/openclaw/pull/130417), titled `fix(ui): show dashboard replies when final events omit messages`. It addresses the specific case where a terminal event belongs to the selected dashboard session but does not itself carry a message.

## The Failure Mode

Dashboard chats depend on a stream of session events plus durable history. In the broken path, the run could reach its terminal boundary, but the final event did not include the assistant message. The reply was already persisted elsewhere, yet the UI did not reliably perform the right follow-up read to surface it.

That left users in an awkward state. The session looked finished, but the answer they were waiting for did not appear. Without a later event or manual recovery path, the interface could feel like the agent had ended silently.

The PR narrows the repair to the first owned, message-less completion for the selected session. That is important because final events that already include a visible reply do not need redundant history work, and unrelated yielded, duplicate, or background events should keep their existing behavior.

## What OpenClaw Does Now

The Control UI event coordinator now reconciles durable history after that message-less completion. The newer read supersedes stale history requests that began before the terminal boundary, including cases where a pending session-message reload is consumed.

In practice, that means a stale in-flight snapshot should no longer hide the newly persisted reply. The dashboard can recover the visible answer after the run finishes instead of waiting for a later nudge.

This is not a broad redesign of dashboard chat. It is a targeted coordination fix around event ordering, terminal state, and durable transcript refresh. That makes the user-facing behavior better while leaving normal message-bearing finals alone.

## Why It Matters

OpenClaw’s dashboard experience is increasingly a control surface for long-running agent work, pinned app views, and session activity. A terminal run with no visible reply creates uncertainty at exactly the moment users expect closure.

The value of this fix is trust. When the dashboard says a run is Done, users should see the persisted assistant response if one exists. They should not need to guess whether the model failed, the UI missed an event, or history is stale.

The merged commit, [`7a550091`](https://github.com/openclaw/openclaw/commit/7a550091d1c661828fde5d26a9f3ca7783023e6d), records the final implementation as recovering dashboard finals after message-less terminal events and preserving the refresh after pending reloads.

The PR includes focused Chromium regression evidence, mock-gateway coverage, stale-history tests, and a video proof label. For a UI/session-state bug, that combination is notable because it validates both the event coordinator logic and the browser-visible behavior users actually see.
