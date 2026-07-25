---
title: "OpenClaw Shows Swarm Progress in Native Apps"
excerpt: "OpenClaw native chat surfaces now show live Swarm progress cards on iOS, macOS, and Android while parallel workers run."
coverImage: '/assets/images/posts/openclaw-2026-7-25-native-swarm-progress.png'
date: '2026-07-25T23:05:00.000Z'
dateFormatted: July 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-25-native-swarm-progress.png'
---

OpenClaw merged [PR #113850](https://github.com/openclaw/openclaw/pull/113850), bringing live Swarm progress into native iOS, macOS, and Android chat surfaces.

The Control UI already had visibility into parallel Swarm workers. Native users did not. While a parent chat was coordinating multiple workers, the native apps could leave users without a clear view of the active group, current phase, latest narrator update, or worker-level status.

## What Changed

The new native progress card appears between the transcript and composer while Swarm workers are active. According to the PR, it can show:

- the Swarm group label
- running, done, and failed totals
- the latest narrator update
- phase labels
- accessible worker statuses
- hidden-worker counts

The feature is gated behind the Gateway's `chat.metadata.swarmEnabled` capability. Ordinary chat surfaces remain unchanged when Swarm is disabled.

## Native Apps Catch Up

This merge is mostly about making parallel work understandable outside the browser. If OpenClaw is going to coordinate multi-agent work from a phone, tablet, desktop menu bar, or native chat view, users need to know whether the work is still running, which phase it is in, and whether worker sessions are failing.

The implementation keeps that state scoped to the focused parent chat and one immutable Gateway route. The PR also says terminal groups disappear instead of becoming transcript state, which keeps progress display separate from durable chat history.

That separation matters. A progress card should explain the running job; it should not permanently clutter the transcript once the group is done.

## Reliability Details

Swarm progress is not just a rendering problem. Native clients can switch sessions, reconnect to different Gateways, or receive events out of the ideal order.

The PR handles mutable session ordering with bounded, deduplicating recovery passes. It also clears the prior roster when users switch sessions or Gateways, reducing the chance that progress from one context appears in another.

The macOS app gets visual spacing improvements around session search and the progress card as part of the same work, making the new state easier to scan.

## Validation

OpenClaw reports broad native and Gateway validation for the merge:

- 336 Swift tests passed across Swarm progress, chat view model, and Gateway node session coverage
- 89 Gateway chat tests passed
- iOS Debug simulator build passed for iPhone 17 on iOS 27.0
- macOS test build passed
- Android lint, focused Swarm unit tests, and a third-party debug build passed
- native i18n verification and `pnpm check:changed` passed

The PR also includes visual proof for iOS and macOS. That is the right kind of evidence for this feature: progress surfaces are only useful if they are both technically scoped and visible in the places users actually watch their agents work.
