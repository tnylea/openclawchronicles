---
title: "OpenClaw Scopes Discord Presence Greetings"
excerpt: "OpenClaw now checks Discord channel visibility before routing presence greetings, preventing unrelated guild members from waking agents."
coverImage: '/assets/images/posts/openclaw-2026-7-15-discord-presence-scoping.png'
date: '2026-07-15T23:03:00.000Z'
dateFormatted: July 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-15-discord-presence-scoping.png'
---

OpenClaw merged a Discord channel fix today that keeps presence greetings inside the audience of the configured channel. [PR #108448](https://github.com/openclaw/openclaw/pull/108448), `fix(discord): stop channel presence greetings for unrelated guild members`, merged at 20:51 UTC on July 15.

The issue was subtle but important for busy Discord servers: presence updates are scoped at the guild level, while an OpenClaw greeting may be configured for a particular channel. Without a channel-visibility check, a human member coming online elsewhere in the guild could wake the agent for a channel they could not actually view.

## The New Boundary

OpenClaw now verifies that the Discord member can view the configured target channel before routing a wake. Public threads inherit parent visibility, while private threads additionally require membership or Manage Threads permission. Lookup failures deny the wake.

The existing optional user allowlist and durable eight-hour cooldown remain in place. That means the fix narrows who can trigger the greeting without changing the broader rate-limiting behavior operators already rely on.

## Why This Matters

Presence greetings are meant to feel lightweight: someone comes online, the agent has context, and the channel gets a timely nudge. But in a multi-channel guild, that convenience can become noise if unrelated members trigger the wrong agent path.

It can also leak workflow assumptions. If a private or narrowly scoped channel has an agent greeting, a guild-wide presence event should not be enough to make that agent react. The PR closes that gap by tying the wake decision to the same channel audience the greeting is meant for.

## Evidence and Tests

The PR adds regression coverage for inaccessible guild members, repeated offline-to-online flaps, public-thread parent permissions, and private-thread membership and moderator cases.

The evidence section reports 85 passing Discord tests across presence listener and basic send-message suites, plus a successful `pnpm check:changed` run on Blacksmith Testbox.

## Operator Takeaway

If you use Discord presence greetings, this should reduce accidental wakes in large servers and keep greetings aligned with channel permissions. There is no new configuration shape in the PR; the behavior changes at the routing boundary.

The broader pattern is encouraging. OpenClaw's channel integrations increasingly treat message delivery, permissions, identity, and presence as one connected surface. That is the right posture for agents operating in shared human spaces.
