---
title: "OpenClaw Android Fix Unblocks Legacy Gateway Sends"
excerpt: "OpenClaw Android now uses Gateway method catalogs to avoid legacy RPC retry loops that left healthy chat sends stuck in the outbox."
coverImage: '/assets/images/posts/openclaw-2026-8-20-android-legacy-gateway-sends.png'
date: '2026-08-20T08:03:00.000Z'
dateFormatted: August 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-20-android-legacy-gateway-sends.png'
---

OpenClaw merged an Android compatibility fix this morning for a particularly bad user-facing failure: messages could remain queued even while the app was connected to a healthy Gateway. [PR #126540](https://github.com/openclaw/openclaw/pull/126540), "fix(android): gate gateway RPC polling on the hello method catalog," targets released `openclaw@2026.7.1-2` gateways and the way the Android app detected unsupported RPC methods.

The PR says the defect was live-reproduced on August 17. The symptom was confusing: chat history worked, so the connection looked healthy, but sends stayed in the outbox with a queued-for-reconnect message. In the background, the app retried branch and question RPCs indefinitely.

## The Root Cause

Modern Gateways report unsupported methods with text like `unknown method: X`. The Android app was watching for that shape.

Older 2026.7.x Gateways behaved differently. They authorized before method dispatch, so an unknown method could look like a missing `operator.admin` scope instead of an unknown-method error. That meant the app did not recognize the method as unavailable.

Three things then went wrong:

- `sessions.branches.list` never got marked unsupported, so pending branch-scope reconciliation kept retrying.
- The outbox never reached a flushable state for the queued send.
- `question.list` and `progressCard.get` could also be called repeatedly on every health event.

The app was connected, but it was stuck waiting on feature checks the older Gateway could never satisfy in the expected way.

## The Fix

The repair uses the Gateway hello handshake as the source of truth. Released 2026.7.x Gateways already expose a method catalog through `hello-ok.features.methods`, and Android already carries that information into its runtime.

The PR generalizes that into a tri-state method availability check. If the catalog is known and a method is not advertised, Android can skip the network call and treat that feature as unavailable immediately.

That changes the flow in the important places:

- Branch listing throws a marker unsupported exception without making the legacy Gateway reject it.
- Question refresh clears stale question cards and finishes when the method is absent.
- Progress card refresh skips `progressCard.get` when the method is not advertised.
- The existing legacy stream fallback keeps its semantics.

## Why It Matters

This is a compatibility fix, but it protects a core mobile workflow: sending a chat message. The PR text calls a silent non-outcome one of the worst bug classes in the repo, and that framing is right. A send that stays queued while the app appears online gives users very little to act on.

By negotiating features from the Gateway catalog instead of interpreting older error text, Android should behave more predictably across supported Gateway versions.

The change is also nicely bounded. It does not ask older Gateways to change behavior, and it does not add another one-off boolean for each feature. It gives the app one shared method-advertisement path and lets feature callers use it before making requests.
