---
title: "OpenClaw Fixes macOS Desktop Sharing Worker Startup"
excerpt: "OpenClaw PR #154436 fixes macOS private worker startup when desktop sharing preferences are saved, including named profiles and disabled sharing states."
coverImage: '/assets/images/posts/openclaw-2026-9-21-macos-desktop-sharing-worker.png'
date: '2026-09-21T08:02:00.000Z'
dateFormatted: September 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-21-macos-desktop-sharing-worker.png'
---

OpenClaw merged a macOS reliability fix in [PR #154436](https://github.com/openclaw/openclaw/pull/154436): the app's private worker can now start correctly when a saved desktop-sharing preference is present.

The bug affected the bundled worker path used by the macOS app. If desktop sharing was enabled or disabled through saved preferences, including named profile and native-first startup cases, the private worker could fail before it reached readiness.

## What changed

The root cause was a mismatch between the native launcher and the private worker entry. The launcher still appended existing desktop-sharing flags, but the dedicated worker entry accepted only the bare `node worker` shape. It also called the runtime without forwarding the desktop-sharing preference.

The fix makes the private entry and the generic CLI use the same Commander worker-command definition. That keeps the existing launch contract intact while still rejecting unrelated commands, options, and positional arguments in the private entry.

The production change is small, but the user-facing effect is concrete: desktop sharing can be saved as enabled, disabled, or unspecified without breaking worker startup.

## User impact

For macOS users, the practical result is that the app can start its bundled worker across the expected desktop-sharing states:

- Fresh state with sharing unspecified
- Fresh state with sharing enabled
- Fresh state with sharing disabled
- Named profile and native-first state with each of those preferences

The PR says no settings, storage, or protocol changes are required. An unspecified preference keeps the existing behavior. Enabled cases advertise `desktop.stream`; disabled cases omit it.

That distinction matters because desktop sharing is both a capability and a consent-sensitive setting. The fix does not simply force the capability on. It preserves the user's saved preference while restoring startup reliability.

## Why it matters

Native app bugs can be frustrating precisely because they happen before the user gets useful feedback. A worker that exits before readiness turns a preference into a startup failure, and named profile paths make the failure harder to diagnose.

By sharing the worker-command parser between the private and generic entries, OpenClaw reduces drift between the CLI contract and the native launcher contract. The app can keep passing the flags it already knows about, and the worker can parse them consistently.

## Validation notes

The PR reports that the actual signed pre-fix bundle exited before readiness when existing sharing flags were present. Baseline regression cases failed before the fix and passed after it.

Validation covered focused entry, lifecycle, generic CLI, and runtime suites. Exact-head CI and independent review passed. The author also ran canonical ARM64 worker staging on macOS using the installer-owned Node runtime and existing compiled build.

All six packaged startup cases reached readiness, with desktop capability present only when appropriate. The PR-stage proof stops short of claiming a deployed corrected app; full signing and repeated signed-worker proof are left for the resulting main build before fleet activation.
