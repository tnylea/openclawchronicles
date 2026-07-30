---
title: "OpenClaw Adds Codex WebSocket Reconnects"
excerpt: "OpenClaw now keeps remote Codex WebSocket sessions healthier with bounded startup, idle heartbeats, and background reconnects."
coverImage: '/assets/images/posts/openclaw-2026-7-30-codex-websocket-reconnect.png'
date: '2026-07-30T23:02:00.000Z'
dateFormatted: July 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-30-codex-websocket-reconnect.png'
---

OpenClaw merged a Codex transport reliability fix tonight for operators who run Codex through a remote WebSocket app-server. [PR #116135](https://github.com/openclaw/openclaw/pull/116135), titled `fix(codex): add remote WebSocket heartbeat and reconnect`, changes the remote transport from a mostly request-driven connection into one that can detect dead links while idle and reconnect in the background.

The problem was a bad fit for long-running assistant sessions. If the opening handshake stalled, or if an established WebSocket became half-open, a Codex session could remain visibly in progress until another request tried to use the connection. In one real deployment cited by the PR, repeated startup timeouts surfaced roughly ten minutes after each affected session began.

## What Changed

For explicitly configured `transport: "websocket"` Codex app-server setups, OpenClaw now adds:

- A bounded 10-second opening handshake
- WebSocket protocol ping frames every 20 seconds
- A 20-second pong deadline
- Tolerance for five consecutive missed pongs before closing the connection
- Bounded, jittered exponential reconnect backoff
- Operator-visible terminal errors for permanent authentication, configuration, or compatibility failures

The change does not affect local `stdio` or Unix socket Codex transports. It also does not invoke a model turn. The startup path initializes the shared app-server connection and verifies transport health without sending inference work.

## Why It Matters

Remote Codex is useful when the app-server lives outside the Gateway process or on separate infrastructure. That split also means the network connection becomes a first-class availability dependency. A half-open socket can make the product feel stuck even though neither side has fully crashed.

The new heartbeat turns that invisible state into a bounded lifecycle. Transient packet loss can recover. Persistently dead links are closed and reconnected. Misconfigured or unauthorized endpoints stop retrying and produce a clear error instead of quietly spinning.

## Validation

The PR includes live proof against a separately hosted authenticated Codex app-server running version `0.146.0`. The author reports startup, ping/pong, injected connection loss, and automatic reconnect all passing with zero model turns invoked.

It also cites source-level checks against upstream Codex WebSocket behavior, including ping/pong handling, connection-close lifecycle, authenticated upgrades, and reconnect regression coverage. OpenClaw added focused tests for idle health, missed pongs, HTTP 401/403 upgrade failures, remote service registration, local transport isolation, startup without inference, transient reconnect, permanent auth failures, invalid configuration, and shared-client lease cleanup.

This is not a flashy feature, but it is exactly the kind of transport hardening that makes remote coding-agent setups less brittle in production. The important part is that failures become prompt, bounded, and recoverable before the next user turn has to discover them.
