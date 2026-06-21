---
title: "OpenClaw Adds Slack Relay Mode for Gateways"
excerpt: "OpenClaw Slack relay mode lets operators route incoming Slack events through a central router while keeping outbound Web API delivery."
coverImage: '/assets/images/posts/openclaw-2026-6-21-slack-relay-mode.png'
date: '2026-06-21T23:02:00.000Z'
dateFormatted: June 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-21-slack-relay-mode.png'
---

OpenClaw's Slack integration picked up a new relay mode for incoming messages in [PR #94707](https://github.com/openclaw/openclaw/pull/94707). The feature is aimed at operators who want a central Slack router to own the Slack connection and then route selected messages to the right OpenClaw gateway.

That matters for teams running more than one gateway, more than one agent, or more than one Slack-facing deployment. Instead of every OpenClaw gateway needing to hold its own direct Slack Socket Mode connection, a router can maintain the Slack side and forward routed events over a websocket.

## What Relay Mode Does

The PR adds a Slack `relay` connection mode. In this mode, OpenClaw receives routed Slack events through a websocket while continuing to use Slack's Web API for outbound messages.

The new mode supports:

- Bearer-token authentication.
- A `gatewayId` for routing.
- Reconnect behavior using the existing Slack backoff policy.
- Serialized inbound frame handling.
- Connection health reporting.
- Normal Slack message dispatch after the routed event arrives.

The router can also send identity fields such as `username`, `icon_url`, or `icon_emoji` in its websocket hello frame. OpenClaw stores that identity for the Slack account and uses it for outbound `chat.postMessage` calls unless an explicit identity is supplied. The stored identity is cleared when relay disconnects or the provider stops.

## Configuration Shape

Relay mode introduces a small set of top-level or per-account settings:

- `mode: "relay"`
- `relay.url`
- `relay.authToken`
- `relay.gatewayId`

Relay accounts still need a bot token for outbound Slack API calls. They do not need a Slack app token or HTTP signing secret, because the router owns that part of the connection.

Existing Socket Mode and HTTP behavior are not removed or reworked. This is an additional connection mode, not a replacement.

## Why Operators Should Care

The interesting part is not just transport plumbing. Relay mode makes Slack routing an explicit deployment concern. A team can put policy and user-group routing in a central `openclaw-slack-router`, then let individual gateways keep their existing persona, processing, and outbound message behavior.

That is a cleaner model for larger OpenClaw installations. It also gives operators a path to route user-group mentions to the right gateway without duplicating Slack connection ownership everywhere.

The PR touched 34 files with 1,359 additions. The authors reported formatting, linting, `git diff --check`, and live relay delivery from Slack through the router to OpenClaw and back to Slack. A broader TypeScript check was blocked by an unrelated missing-module issue in a Slack test harness, so this is a feature worth watching in the next release notes.

