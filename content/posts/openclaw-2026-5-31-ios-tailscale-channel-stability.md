---
title: "OpenClaw 2026.5.31: iOS Talk, Tailscale Gateway, and Channel Stability"
excerpt: "The v2026.5.31 beta rounds out today's releases with iOS realtime Talk, Tailscale Serve gateway bindings, and stability fixes across a dozen chat channels."
coverImage: '/assets/images/posts/openclaw-2026-5-31-ios-tailscale-channel-stability.png'
date: '2026-05-31T23:05:00.000Z'
dateFormatted: May 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-31-ios-tailscale-channel-stability.png'
---

Today's `v2026.5.31-beta.3` caps off a busy day for OpenClaw. The morning already brought [Skill Workshop](/posts/openclaw-2026-5-31-skill-workshop) and the externalization of the [Copilot and Tokenjuice plugins](/posts/openclaw-2026-5-31-copilot-tokenjuice-plugins). The afternoon beta iterations filled in the rest: iOS improvements, Tailscale gateway exposure, Control UI additions, and a broad channel stability sweep.

## iOS Gets Realtime Talk and a Push Relay

Mobile OpenClaw users get three meaningful improvements in this release:

- **Hosted push relay defaults** — iOS sessions now fall back to OpenClaw's hosted relay for push notifications, improving delivery reliability when a self-hosted push path is not configured.
- **Realtime Talk playback** — voice responses in Talk sessions play back in realtime rather than waiting for a full audio segment to complete, making voice interactions feel noticeably more responsive.
- **Guarded WebSocket ping** — a bounded WebSocket ping path keeps iOS sessions alive across brief network interruptions without burning full reconnect timeouts.

These changes land in [#88096](https://github.com/openclaw/openclaw/pull/88096), [#88105](https://github.com/openclaw/openclaw/pull/88105), and [#88231](https://github.com/openclaw/openclaw/pull/88231).

## Tailscale Serve Service-Name Bindings

Gateway operators running OpenClaw on Tailscale now have explicit support for Tailscale Serve service-name bindings. Previously, exposing OpenClaw's gateway to a Tailscale service name required configuration outside the OpenClaw config system. Now the gateway understands these bindings natively, and `openclaw gateway status` reflects the Tailscale exposure correctly. Contributed by [@VladyslavLevchuk](https://github.com/VladyslavLevchuk) in [#74715](https://github.com/openclaw/openclaw/pull/74715).

## Control UI Updates

Two long-requested additions land in the Control UI:

- **Dreaming-tab agent selector** — the Dreaming tab now lets you pick which agent the diary runs against, rather than always defaulting to the primary agent. ([#78748](https://github.com/openclaw/openclaw/pull/78748) by [@stevenepalmer](https://github.com/stevenepalmer))
- **Communication Notifications settings** — notification controls are now reachable directly from the main settings tab, so you no longer need to navigate through nested menus to adjust channel notification behavior. ([#74715](https://github.com/openclaw/openclaw/pull/74715) by [@VladyslavLevchuk](https://github.com/VladyslavLevchuk))

## Channel Stability Sweep

Perhaps the broadest change in today's release is a channel-wide stability sweep. OpenClaw now bounds request and retry timers across Telegram, Discord, WhatsApp, Signal, Feishu, Google Chat, Microsoft Teams, QQBot, Nostr, Zalo, Zalouser, and Nextcloud-style integrations.

Additional fixes in this sweep:

- SMS approval reply routes are preserved across reconnects.
- WhatsApp QR login 408 timeouts now retry automatically.
- Progress drafts recover from failed starts across Discord, Telegram, Slack, Matrix, and Teams — rather than silently losing early progress updates. ([#83115](https://github.com/openclaw/openclaw/issues/83115), [#88749](https://github.com/openclaw/openclaw/pull/88749))
- Discord REST entity cache growth is now bounded, and recovered tool warning output no longer creates pinging mentions.
- Gateway chat failures surface as visible assistant messages in the Control UI instead of only setting an invisible error state.

## Security Config Parsing

The security config parsing layer now rejects a range of unsafe settings before they can affect runtime behavior:

- OAuth and token lifetimes set to unreasonable values
- Retry-after delays and inbound timestamps outside expected ranges
- Response body sizes configured above safe limits
- Command timeout config values that could allow indefinite hangs
- Gateway WebSocket calls that continue after a close event

Gateway bootstrap-token verification also picks up rate limiting in this release, and session display names are guarded against direct injection.

## Memory and Performance

Memory writes are serialized per store, preventing race conditions between concurrent gateway and CLI activity. Generated transcript paths rewrite correctly on rollover, so memory search state survives restarts cleanly. ([#66339](https://github.com/openclaw/openclaw/issues/66339), [#85931](https://github.com/openclaw/openclaw/pull/85931) by [@openperf](https://github.com/openperf))

On the performance side, provider handles, tool schemas, gateway runtime metadata, skill allowlists, package-local plugin artifacts, and validated session prompt blobs are all reused or prebuilt rather than reconstructed per turn — reducing startup and per-turn overhead on hot paths.

The full changelog is at [github.com/openclaw/openclaw/releases/tag/v2026.5.31-beta.3](https://github.com/openclaw/openclaw/releases/tag/v2026.5.31-beta.3).
