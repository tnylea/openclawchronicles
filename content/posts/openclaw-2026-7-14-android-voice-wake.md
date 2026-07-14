---
title: "OpenClaw Adds Android Voice Wake"
excerpt: "OpenClaw Android now supports foreground Voice Wake with editable wake words, Gateway sync, listener status, and safe audio ownership pauses."
coverImage: '/assets/images/posts/openclaw-2026-7-14-android-voice-wake.png'
date: '2026-07-14T08:02:00.000Z'
dateFormatted: July 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-14-android-voice-wake.png'
---

OpenClaw merged Android foreground Voice Wake on Tuesday morning, bringing the shared wake-word workflow to Android users who previously had to rely on manual mic capture or Talk.

The new feature lets Android users enable Voice Wake in Settings, speak a configured wake word followed by a command, and see listener status while the app is visible.

Source: [OpenClaw PR #107081](https://github.com/openclaw/openclaw/pull/107081)

## What Changed

Android Voice Wake uses the platform's on-device speech recognizer. It does not add a background service, paid speech provider, custom model, or new dependency.

The feature includes:

- editable wake words
- Gateway-synced wake-word configuration
- command forwarding through the existing node voice transcript event
- visible listener status
- automatic pauses when another OpenClaw voice surface owns audio

That last point is the core product boundary. Voice Wake should feel available when the user wants hands-free control, but it should not fight Talk, manual dictation, voice-note capture, or message speech.

## Foreground Only

The PR is explicit that this is foreground-only Voice Wake. Android listens while OpenClaw is visible, not as an always-on background assistant.

That choice keeps the first Android implementation conservative. It gives users the shared wake-word workflow without introducing a persistent background listener or a broader battery, privacy, and permission surface.

Foreground-only also matches the implementation's dependency choices. The platform recognizer handles speech locally, and OpenClaw forwards commands through its existing node voice transcript path rather than inventing a new voice transport.

## User Impact

For Android operators, this reduces friction in a common mobile flow. Instead of tapping Talk or holding a manual mic surface, a user can open OpenClaw, say the configured wake word, and issue the command.

The listener status should also make the feature easier to trust. Voice features become frustrating when users cannot tell whether the app is listening, paused, or blocked by another audio mode. The PR's pause rules keep ownership clear:

- Talk pauses Voice Wake.
- Manual dictation pauses Voice Wake.
- Voice-note capture pauses Voice Wake.
- Message speech pauses Voice Wake.

That makes Android Voice Wake part of the existing voice system rather than a competing input layer.

## Verification

The PR reports hosted CI passing for the final head and its code/test parent, plus Blacksmith Testbox validation for the code/test head.

Android-specific validation included i18n checks, ktlint, full Play and third-party unit-test suites, Play debug APK build, Play and third-party lint, and a captured API 36 emulator scene inspected for accessibility and crash signatures.

The author notes that acoustic recognition plus a live Gateway remains device- and environment-dependent. The deterministic coverage focuses on the manager, matcher, cancellation, preference, capability, sync, and screenshot routes.

This is a meaningful mobile parity step. Android now gets a wake-word path that is intentionally scoped, visible, and wired into the existing OpenClaw voice pipeline.

