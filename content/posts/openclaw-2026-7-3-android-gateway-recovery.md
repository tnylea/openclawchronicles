---
title: "OpenClaw Android Shows Exact Gateway Recovery"
excerpt: "OpenClaw Android now distinguishes stale credentials, expired setup codes, and pending node approvals with targeted Gateway recovery actions."
coverImage: '/assets/images/posts/openclaw-2026-7-3-android-gateway-recovery.png'
date: '2026-07-03T08:02:00.000Z'
dateFormatted: July 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-3-android-gateway-recovery.png'
---

OpenClaw merged [PR #99414, "fix(android): expose exact gateway recovery actions"](https://github.com/openclaw/openclaw/pull/99414) shortly before the July 3rd morning scan, tightening one of the Android app's most important setup and recovery flows.

The old behavior grouped several different failures under generic retry states. A stale credential, an expired setup code, and a pending node capability approval could all leave the user staring at a recovery screen that did not explain the exact next action.

That is especially frustrating for mobile nodes. Android may be acting as a notification bridge, a companion client, or a device-backed node surface. When pairing or reconnecting fails, the app needs to tell the user whether to scan, edit, approve, or simply retry.

## What Changed

The Gateway can now include a pending node request ID, but only under a narrow condition: a signed read-scoped Android client must be reading its own device-backed node. Pending capability declarations for other nodes remain redacted.

Android then carries the phone's capability approval state and optional request ID as one closed value. Onboarding and Nodes & Devices use the same command mapper, so a valid request ID can produce an exact host command:

`openclaw nodes approve <id>`

If the ID is malformed, unavailable, expired, or no longer applicable, the app falls back to the safer `openclaw nodes status` guidance.

## Better Failure Routing

The recovery flow now separates the common cases:

- Expired bootstrap tokens route users to scan a fresh setup code.
- Stale stored client credentials route users to edit the connection.
- Gateway-host authentication configuration stays on a retry path after the host-side issue is fixed.
- Pending node approval can show the exact command when it is safe to expose.

The PR also says Android clears cached approval IDs when the target changes, ages cached commands back to the status fallback, and refreshes `node.list` while approval remains pending.

That matters because approval IDs are gateway-local and short-lived. Treating them as durable instructions would make the recovery UI misleading, and potentially unsafe, after a connection or target changes.

## Why It Matters

This is a small surface with a large trust impact. A user who already knows what went wrong can recover quickly. A user who does not know whether the phone needs a new QR code, a corrected token, or a host-side approval command should not have to guess.

The implementation also preserves the boundary between the current phone and other devices. The request ID is not a broad introspection feature for any read-only client; it is scoped to the signed identity that owns the pending device-backed node.

That keeps the convenience of exact recovery without turning pending node approvals into globally readable state.

## Evidence

The PR reports Gateway authorization tests proving unrelated read-only clients cannot see pending request IDs, while the same signed device identity can see only its own request ID in `node.list` and `node.describe`.

Focused proof included 20 Gateway node-pairing authorization tests, Android tests for node approval, onboarding recovery, and Settings, plus ktlint and Play debug APK assembly.

The real-source Gateway and Android emulator matrix covered pending node approval, expired bootstrap handling, stale-token handling, and launching the recovery scanner from the Play APK.

## Bottom Line

PR #99414 makes Android Gateway recovery more specific and less noisy.

Instead of one vague retry loop, OpenClaw can now tell Android users when to scan a fresh setup code, edit saved authentication, run an exact node approval command, or retry after host-side configuration is corrected.
