---
title: "OpenClaw Fixes Failed Run Status in Channels"
excerpt: "OpenClaw now marks recovered failed agent runs as errors across Telegram, Discord, Slack, Signal, and WhatsApp instead of misleading completed states."
coverImage: '/assets/images/posts/openclaw-2026-8-11-channel-failure-reactions.png'
date: '2026-08-11T23:01:00.000Z'
dateFormatted: August 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-11-channel-failure-reactions.png'
---

OpenClaw merged a user-visible channel reliability fix today in PR [#122009](https://github.com/openclaw/openclaw/pull/122009): recovered agent-run failures now end with the right reaction or status across Telegram, Discord, Slack, Signal, and WhatsApp.

The bug was subtle but frustrating. A failed agent run could recover enough to deliver a visible error message, while the channel UI still showed a completed reaction. In practice, users saw an error payload and a success-looking terminal state at the same time.

## Delivery is not success

The core mistake was treating delivery success and run success as the same fact. If OpenClaw successfully sends an error message, the transport did its job, but the agent run still failed.

The fix adds a narrow terminal-outcome carrier inside the dispatch result path. Channel plugins can read the terminal semantic through the existing `openclaw/plugin-sdk/channel-inbound` surface without changing the JSON protocol shape. The PR keeps the internal symbol private, exports a reader, and intentionally avoids broad result-type reachability.

That matters because delivery objects are copied and reconciled in several places. The terminal outcome needed to survive those object spreads while staying invisible to JSON serialization and external protocol consumers.

## Channel impact

The affected surfaces now use the shared reader to choose the terminal state:

- Telegram
- Discord
- Slack
- Signal
- WhatsApp Web

Slack native progress cards also finish in an error state for recovered failures. Normal success, raw throws, delivery failures, silent paths, dedupe, busy, command, pre-run abort, and custom dispatch behavior are unchanged.

For users, the visible result is simple: when a started run fails after partially responding, the channel should now look failed instead of completed.

## Why this is a release-line fix

This landed as a P1 channel compatibility fix with successful exact-head CI. The PR includes focused carrier tests, core terminal-recovery tests, and channel-specific coverage across Telegram, Discord, Signal, WhatsApp, and Slack.

The Telegram proof boundary is especially worth noting. A protected live run proved in-place recovery with no duplicate fallback message, while deterministic controller coverage proved the error status behavior. Telegram's Bot API does not expose bot-authored reaction updates back to the bot, so the PR is careful not to overclaim full live reaction proof.

## The bigger pattern

OpenClaw's channel layer keeps getting more precise about what happened, not just whether some bytes moved. This PR follows that direction: terminal state belongs to the run, delivery state belongs to the transport, and UI reactions should reflect the right one.

For operators using OpenClaw in group channels, that is the kind of small correction that prevents a lot of confusion during incident response, support work, and long-running automations.
