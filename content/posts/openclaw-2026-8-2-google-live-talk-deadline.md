---
title: "OpenClaw Fixes Google Live Talk Deadlines"
excerpt: "OpenClaw PR #117490 fixes Gemini Live startup by honoring Google's 60-second new-session activation deadline."
coverImage: '/assets/images/posts/openclaw-2026-8-2-google-live-talk-deadline.png'
date: '2026-08-02T08:03:00.000Z'
dateFormatted: August 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-2-google-live-talk-deadline.png'
---

OpenClaw merged a P1 availability fix for realtime voice this morning with [PR #117490, "fix(google): honor Gemini Live new-session activation deadlines"](https://github.com/openclaw/openclaw/pull/117490). The patch corrects how OpenClaw treats Google Live browser Talk session expiration during startup.

The bug came from a mismatch between two different time concepts. Google permits creating a new Live connection for only 60 seconds, while an already established session can remain valid for 30 minutes. OpenClaw's Gateway and persisted session owner also expect epoch milliseconds, but the Google provider returned an epoch-seconds expiration.

That combination could reject browser Talk sessions during startup or, in the opposite direction, treat an expired new-connection token as if it were still usable.

## What Changed

The provider now returns the existing `newSessionExpiresAtMs` value as the browser-session expiration. Google SDK requests keep their independent ISO expiration fields:

- `newSessionExpireTime` remains the 60-second activation window
- `expireTime` remains the 30-minute established-session lifetime
- token constraints, authentication, cancellation, and protocol shapes stay unchanged

This is a small production change, but it matters because realtime voice startup is timing-sensitive. A user can be delayed by microphone permission prompts, browser setup, or device readiness. OpenClaw needs to know whether it is still allowed to open a new Google Live connection, not merely whether an already connected session would have remained alive.

## Why It Matters

Realtime Talk failures are especially visible. When voice startup fails, the user does not get a subtle degradation. The session simply does not begin, or it begins with confusing timing behavior.

With this fix, Google Live Talk can start normally when the new-session token is still inside its real activation window. If startup slips beyond that window, OpenClaw should no longer pretend the token is valid for the broader 30-minute session lifetime.

That distinction also protects reliability work elsewhere in the Gateway. Persisted session ownership, browser relay setup, and provider-specific SDK expirations can now agree on which deadline they are enforcing.

## Evidence

The PR reports an authentic fake-clock regression that reproduced the old behavior: an expired new-session token was still accepted after 60,001 milliseconds. The corrected provider returns the exact 60-second epoch-millisecond deadline while preserving both Google SDK ISO expirations.

The focused Google realtime voice provider suite passed 50 of 50 tests. The PR also reports live exact-head verification on August 2, 2026: a real Google token mint returned a 13-digit epoch-millisecond expiry with a 60,000 millisecond activation delta, and the browser Google Live WebSocket reached setup completion, accepted a JPEG video frame, invoked `describe_view`, and accepted the matching function response.

No credentials, private endpoints, or raw provider payloads were retained in the evidence. For OpenClaw users, the main effect is that Gemini Live browser Talk startup now observes the deadline Google actually gives it.
