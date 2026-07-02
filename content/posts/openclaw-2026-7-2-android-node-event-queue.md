---
title: "OpenClaw Android Queues Node Events Safely"
excerpt: "OpenClaw now queues Android notification node events until Gateway handshakes finish, preserving ordered delivery without duplicate replays."
coverImage: '/assets/images/posts/openclaw-2026-7-2-android-node-event-queue.png'
date: '2026-07-02T23:01:00.000Z'
dateFormatted: July 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-2-android-node-event-queue.png'
---

OpenClaw merged [PR #92602, "fix(android): queue node events until gateway connect"](https://github.com/openclaw/openclaw/pull/92602) late on July 2nd, closing a P1 message-delivery gap in the Android app.

The bug sat in a narrow but important window: Android notification forwarding could send a `node.event` while the WebSocket existed but the Gateway handshake had not completed. Because the Gateway expects `connect` to be the first request, notifications generated during startup or reconnect could be missed before the session was actually ready.

For users who rely on Android as a node surface, that matters. Notification forwarding is often the bridge between the phone and automations running elsewhere. A connection that looks alive but silently drops early events is exactly the kind of failure that makes an agent feel unreliable.

## What Changed

The fix gives each `GatewaySession.Connection` its own pending RPCs and explicit connection state: connecting, ready, or closed. Outbound RPCs only see a connection after it is ready.

Notification events now sit in one bounded FIFO queue and are released only after the Gateway handshake completes. That gives OpenClaw a simple delivery rule: accept events while disconnected or handshaking, then deliver them in order once the session is ready.

The PR is also careful about duplicate risk. Events that were definitely not enqueued to OkHttp can be retained, but ambiguous post-enqueue failures are dropped rather than replayed. They still consume their configured rate-limit slot, which keeps retries from becoming a duplicate-delivery path.

## Policy Still Applies

This is not a blind replay buffer. The Android app rechecks listener access, package policy, quiet hours, and session routing at delivery time.

That detail is important because reconnect windows can overlap with user changes. If a user tightens notification policy while events are waiting, the outbox should not push stale content that no longer satisfies the current rules.

The implementation also coordinates notification-policy writes with outbox generation rollover, so restrictive policy changes become visible before another RPC is admitted.

## Why It Matters

The visible user impact is straightforward: notifications accepted while Android is disconnected or still handshaking should be delivered after reconnect, in order, without a duplicate replay storm.

That is a stronger contract than simply retrying whatever was active on the phone. The PR body explicitly says it does not replay the device's entire active-notification set after reconnect. Instead, it keeps a bounded queue of accepted events and applies current policy when those events are sent.

For operators, this makes Android notification forwarding easier to trust during mobile network changes, Gateway restarts, and initial app startup.

## Evidence

The PR includes a real Gateway proof on an Android 36.1 emulator. The tester stopped the Gateway, waited until the node connection closed, posted a unique shell notification, and restarted the Gateway.

After the handshake completed, the Gateway received exactly one `node.event`, returned success in 186 milliseconds, and no duplicate followed.

Focused Android unit suites also passed for gateway invocation, reconnect behavior, notification outbox handling, and bootstrap auth. The change was additionally checked with Android lint, app assembly, native i18n validation, `pnpm check:changed`, and autoreview.

## Bottom Line

PR #92602 turns a timing-sensitive Android transport bug into a bounded, policy-aware queue.

That is the right shape for a mobile node: no early send before `connect`, no broad notification replay after reconnect, and no duplicate sends when the transport state is ambiguous.
