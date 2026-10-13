---
title: "OpenClaw Unfreezes Offscreen Reply Navigation"
excerpt: "OpenClaw PR #170789 removes a redundant render loop that could freeze offscreen reply navigation and position-rail jumps in the Control UI."
coverImage: '/assets/images/posts/openclaw-2026-10-13-control-ui-offscreen-reveals.png'
date: '2026-10-13T08:10:00.000Z'
dateFormatted: October 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-13-control-ui-offscreen-reveals.png'
---

OpenClaw merged [PR #170789](https://github.com/openclaw/openclaw/pull/170789), a focused Control UI fix for a renderer freeze in offscreen reply navigation and position-rail jumps.

The bug lived in a subtle loop. When the target message bubble was not mounted, `completeMessageReveal()` would scroll toward the virtual row and then unconditionally request another render. A prior change moved layout completion from a browser frame to a microtask, and that made the repeated render request capable of starving the native scroll notification that needed to advance the virtual range.

In plain English: the UI could get stuck trying to reveal a message that was not currently mounted.

## What Changed

The fix removes the redundant render request. The first reveal still asks for an update when folded work needs expansion, but subsequent movement is owned by the actual mechanisms that can make progress:

- Native scroll notifications.
- Mounted rows.
- Deferred projection settlement.
- Existing target highlighting and cancellation behavior.

The accepted edge case is also clear. If the target is absent, OpenClaw now waits for a real scroll, row mount, or projection event instead of polling unchanged DOM.

That tradeoff matters because the old behavior looked more aggressive but could block the very signal it needed. The new behavior is less noisy and more faithful to the renderer's actual state.

## Why It Matters

Reply navigation is one of those features users notice only when it fails. In a long agent conversation, jumping back to the source of a reply, moving through the position rail, or revealing an earlier collapsed message needs to feel boringly reliable.

The PR's baseline evidence captured failures in several original cases: deep standalone-work reply reveal, dark and light position-rail navigation, and reply-source navigation after reconnect. The candidate then passed those original cases in a focused hosted run.

This is not a broad UI rewrite. The PR reports a one-file change with only a small line delta. That is good news for a renderer bug: less surface area means less chance of moving unrelated layout or transcript behavior.

## Verification

The PR cites a focused hosted run where all four original cases passed:

- Dark and light position-rail navigation.
- Deep earlier-message reveal.
- Reconnect source navigation.

It also reports that changed-file formatting, linting, and `git diff --check` passed, with an independent Codex autoreview finding no actionable P0-P2 issues. Ordinary PR CI passed selected required jobs, including security, types, lint, architecture, and static gates.

## Bottom Line

PR #170789 is a classic small UI reliability patch: remove the extra render nudge, let the real scroll and mount events drive progress, and keep the existing navigation semantics intact.

For anyone using long OpenClaw conversations in the Control UI, the result should be smoother jumps to earlier replies and fewer moments where the interface seems to lose its place.
