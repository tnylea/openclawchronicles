---
title: "OpenClaw Keeps Camera Capture After Preview Errors"
excerpt: "OpenClaw PR #160359 keeps Use device camera available after preview failures, including permission errors, without bypassing browser controls."
coverImage: '/assets/images/posts/openclaw-camera-preview-error-native-capture-fix.png'
date: '2026-09-30T08:02:00.000Z'
dateFormatted: September 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-camera-preview-error-native-capture-fix.png'
---

OpenClaw's Control UI has a new camera-flow fix for users who attach photos from mobile or browser sessions. [PR #160359](https://github.com/openclaw/openclaw/pull/160359), merged Wednesday morning, keeps the explicit **Use device camera** option available after live camera preview errors, including permission rejection.

Before the fix, a failed preview request could make the native-camera option disappear. That left users with fewer recovery choices right when they needed a clear next step. The new behavior keeps **Use device camera** available beside **Upload photo**, **Cancel**, and **Try again** after preview errors.

## The Problem

Camera capture in browser-based UIs has a subtle contract. The app can offer a capture path, but the browser owns the picker and permission prompt. If the app accidentally hides the explicit camera action after a preview failure, the user may be stuck without knowing whether the issue was permission-related, device-related, or just a transient preview problem.

The pull request says the missing action appeared after a live camera preview request failed, including cases such as permission rejection. That matters for real mobile usage, where camera permissions can be denied, interrupted, or unavailable depending on browser context.

The fix does not bypass browser permission controls. It keeps the manual action visible so the user can choose the native capture path again.

## What Changed

The PR reuses OpenClaw's existing draft-scoped native capture handler for error states instead of limiting it to capability failures. In practical terms, a failed preview does not remove the user's explicit device-camera choice.

The resulting choices are clearer:

- **Use device camera** remains available after preview errors.
- **Upload photo** remains available as a fallback.
- **Cancel** and **Try again** still support normal recovery.
- The capture picker opens only when the user clicks.
- The browser still controls permissions and device selection.

That is the right boundary. OpenClaw should preserve the user action and the draft context, but it should not try to own browser-level camera permission behavior.

## Streaming Scroll Also Got a Repair

The same PR also includes a related UI reliability repair for streamed text visibility. The author notes that CI exposed a streaming-scroll race: when a smooth follow command was already at the end, it could finish without emitting a native idle event. Later row growth could then lose its end anchor, leaving the newest streamed text slightly out of view.

The fix records that the view actually reached the end through the existing anchor owner. Ongoing smooth scrolling and cases where the reader intentionally scrolls away keep their existing behavior.

For users, the goal is boring in the best sense: if you are following the bottom of a streaming answer, the newest content should stay visible. If you scroll away, the interface should respect that.

## Evidence Behind the Fix

The PR includes real Control UI verification in Chromium with a controlled `NotAllowedError`. The author reports that the fixed UI did not open the picker automatically, that an explicit click opened a single-image `capture=environment` input, and that cancellation remained clean.

Focused tests covered native capture after `NotAllowedError`, `SecurityError`, and `NotReadableError`. The scroll repair also had deterministic and real-Chromium reproduction before the fix, followed by passing focused and sibling tests.

The PR is labeled `P2`, with proof marked sufficient and screenshot evidence attached. It is not a sweeping redesign. It is a targeted repair to a user journey that should never strand people after the first failed camera attempt.

## Why It Matters

OpenClaw is increasingly used from native-adjacent and mobile surfaces, where attachments are part of real workflows. A camera action that disappears after a failed preview makes the product feel brittle, especially when the failure is a normal browser permission outcome.

By keeping the explicit device-camera action available and preserving the browser's authority over capture, OpenClaw makes the attachment flow more predictable without weakening permission boundaries. Small UI recovery fixes like this are easy to miss, but they are the difference between an app that handles rough edges and one that leaves users guessing.
