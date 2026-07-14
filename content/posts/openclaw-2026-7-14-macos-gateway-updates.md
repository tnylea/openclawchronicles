---
title: "OpenClaw Coordinates Mac and Gateway Updates"
excerpt: "OpenClaw now coordinates macOS app updates with app-managed Gateway runtimes, adding progress, recovery guidance, and session wakeups."
coverImage: '/assets/images/posts/openclaw-2026-7-14-macos-gateway-updates.png'
date: '2026-07-14T23:02:00.000Z'
dateFormatted: July 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-14-macos-gateway-updates.png'
---

OpenClaw's macOS app gained a coordinated update path Tuesday night, closing a mismatch between the desktop app and the app-managed Gateway or Mac node runtime. The change landed in [OpenClaw PR #107634](https://github.com/openclaw/openclaw/pull/107634).

Before this patch, Sparkle could update the Mac app while an app-managed Gateway or node runtime stayed on the previous version. Users did not get coordinated progress, recovery guidance, or a clear signal back into the agent session they were using.

## What Changed

The Mac app now records the incoming Sparkle version and runs the canonical `openclaw update` path for app-managed runtimes. It includes a launch-transition fallback for the first recorder-capable release and for manual app replacements.

The update flow preserves paused runtimes, externally managed runtimes, and runtimes that are already newer. After the update attempt, OpenClaw verifies restart health and presents the result in a setup-style completion window.

The PR also adds an exact-session system-event wake. When an update succeeds, OpenClaw can wake the most recently human-used direct top-level session with a concise welcome-back message. The selection logic explicitly prevents cron, heartbeat, group, or spawned-session activity from winning that wake target.

## Why It Matters

Desktop app updates are not just binary swaps when the app owns background runtime processes. If the app updates but Gateway does not, users can end up with a confusing split-brain experience: new UI, old runtime, unclear recovery state, and no obvious place to look.

Coordinating app and Gateway updates gives the macOS app a more durable ownership model. It can show progress while the runtime updates, keep failure diagnostics visible, and avoid pretending the system is healthy before the managed runtime has actually restarted.

The session wake is a nice operator touch. It treats the update as part of the user's current work, but routes the notification narrowly enough that background automation cannot hijack the message.

## User Impact

After a Mac app update, users should see update and verification progress instead of a silent runtime mismatch. If the managed runtime cannot update or restart cleanly, the completion window stays open with diagnostics plus Retry, update-guide, and Discord help actions.

When the update succeeds, the most likely recent normal agent session can receive a short welcome-back message. Externally managed runtimes are left alone, so users who intentionally manage their own Gateway process do not get unexpected app-driven runtime changes.

## Verification

The PR reports 99 focused Gateway, session, and heartbeat tests passing. Swift changes passed parse checks, and the macOS Swift package suite reported 1,178 tests passing with 34 focused update-suite tests.

There was also a Developer-ID-signed app proof in a macOS 26.5 Parallels VM. The test confirmed that post-update progress appeared, runtime health failure settled into the diagnostic state, and Retry, update-guide, and Discord actions remained visible. Healthy completion and real session delivery were fixture-blocked rather than failed, so the implementation leans on the focused Gateway/session test coverage for those paths.
