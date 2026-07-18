---
title: "OpenClaw Fixes Discord Widget Access Boundaries"
excerpt: "OpenClaw Discord widgets now authorize by channel audience while keeping command and DM allowlists separate for operators."
coverImage: '/assets/images/posts/openclaw-2026-7-18-discord-widget-audience.png'
date: '2026-07-18T08:02:00.000Z'
dateFormatted: July 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-18-discord-widget-audience.png'
---

OpenClaw's Discord widgets are getting a cleaner authorization boundary. [PR #110522](https://github.com/openclaw/openclaw/pull/110522), `refactor(discord): authorize widgets by channel audience`, merged at 07:42 UTC on July 18.

The bug was narrow but user-facing: Discord channel members could see an agent-posted widget message, but could not open the widget unless they were also listed in the agent account's command or DM allowlist.

## The Boundary Change

OpenClaw now treats widget viewing as a Discord channel-audience question. OAuth still establishes the user's identity, but access depends on Discord's Activity instance API confirming two things:

- the user is present in the exact Activity instance;
- the Activity channel matches the original widget channel.

The PR removes the Activity-specific allowlist path. Command authorization and DM authorization stay separate, so opening a widget does not automatically mean a user can command the agent or message it privately.

Operators can still narrow access through Discord channel permissions.

## Why It Matters

Widgets are meant to be shared interface moments inside a channel. If a user can see the posted widget but cannot open it because they are outside an unrelated command allowlist, the channel experience feels broken.

At the same time, widgets can expose interactive state. OpenClaw still needs to prevent someone from another channel, another Activity instance, or outside the intended Discord context from resolving widget content.

PR #110522 draws that line more precisely. Channel participants can open widgets posted into that channel, while users outside the matching Activity instance remain blocked.

## No Compatibility Layer

The PR notes that this is a maintainer-requested correction before the feature's stable shipment. Because of that, it does not keep a compatibility layer or add a new configuration surface.

That is the right shape for this kind of fix. The old behavior tied two separate concepts together: who can use an agent command surface, and who can view a channel-scoped widget. The new behavior makes the widget boundary match the place where the widget was posted.

## Evidence

OpenClaw reports 44 focused Discord Activity tests across interaction, HTTP, and configuration coverage.

The changed gate also passed extension production and test typechecks, full extension lint, formatting, boundary guards, and import-cycle checks. Regression coverage confirms that a user outside the agent allowlist can open a widget only when Discord reports that user in the matching Activity instance, while existing coverage continues to reject users absent from the instance.

The PR also says autoreview was clean with no accepted or actionable findings.

## Operator Takeaway

This is a small authorization refactor with a clear product effect. OpenClaw Discord widgets now follow the channel audience that can actually see and participate in the widget, without weakening command or DM controls.
