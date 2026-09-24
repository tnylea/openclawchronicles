---
title: "OpenClaw Turns Bot Replies On by Default"
excerpt: "OpenClaw now defaults Discord and Slack bot-message admission to on while preserving explicit opt-outs and existing visibility rules."
coverImage: '/assets/images/posts/openclaw-2026-9-24-bot-replies-default.png'
date: '2026-09-24T08:01:00.000Z'
dateFormatted: September 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-24-bot-replies-default.png'
---

OpenClaw merged a major Discord and Slack behavior change this morning: bot messages are now admitted by default when no explicit `allowBots` setting is present. The change landed in [PR #157091](https://github.com/openclaw/openclaw/pull/157091), "fix: preserve bot reply context and enable bot messages by default."

The maintainer decision is explicit in the PR body. An omitted `allowBots` intentionally becomes `true` after updating, while an explicit `false` remains disabled. That means existing installations that deliberately opted out keep their opt-out, but default configurations become more capable in bot-heavy rooms.

## The Problem: Replies Lost Their Parent

The motivating bug was context loss. When a person replied to a bot's Discord message, OpenClaw could see an empty nested parent payload, treat it as complete, and then discard it. At the same time, bot filtering could hide the parent message from recent history.

That combination is exactly the kind of failure that makes chat agents feel strangely forgetful. The user is replying to something visible in the channel, but the agent receives a turn stripped of the parent context it needs to answer well.

PR #157091 changes that for Discord by recovering missing or empty parent content and preserving the reply ID even when the parent cannot be fully fetched or visible supplemental content is hidden. For Slack, the change also tightens self-message filtering by rejecting self-authored events identified only by bot ID.

## Bot Admission And Context Visibility Are Separate

The most important detail is that OpenClaw treats bot-triggered admission and context visibility as separate concerns.

In practical terms:

- Discord and Slack now default omitted `allowBots` settings to `true`
- Explicit `false` and `"mentions"` settings still work
- Accessible bot messages can remain available as context when a person asks about them
- Slack room authorization and existing access rules still apply
- Self-message filters and bot-pair rate guards remain active

That last point matters. Turning bot messages on by default is not the same as allowing unlimited bot loops. The PR says the existing bot-pair rate guard is still active and limits rapid exchanges.

## Why This Matters For Real Rooms

Modern team chats are full of bots: CI, deploy notifiers, customer support systems, task trackers, GitHub integrations, monitoring alerts, and other agents. If OpenClaw cannot understand replies to those messages, it misses a growing slice of the conversation.

Defaulting bot admission on makes OpenClaw more useful in normal operational channels. A user can reply to a bot-posted build failure, Slack alert, or Discord automation message and expect the assistant to see the surrounding context instead of treating the turn like a free-floating question.

The compatibility angle is also clear. This is a default change for omitted settings, not a forced override for explicit policy. Teams that already set `allowBots: false` keep that behavior after updating.

## Evidence Behind The Change

The PR includes a substantial proof trail. The team reports focused Discord, Slack, and core suites passing across 396 tests, plus final reply-ID boundary coverage. It also records Discord transport proof using the real Discord plugin, core dispatcher, mock model, and native REST transport.

On Slack, the added provider allowlist tests showed that an allowed bot with omitted settings reaches the final send call, while a forbidden bot and later messages after revocation do not produce either a model call or an outbound send.

This is the kind of plumbing that rarely gets a splashy feature label, but it changes how OpenClaw behaves in the places people already work. Bot-filled rooms should feel less like special cases and more like first-class conversation surfaces.
