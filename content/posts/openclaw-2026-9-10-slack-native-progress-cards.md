---
title: "OpenClaw Fixes Slack Progress Card Duplication"
excerpt: "OpenClaw now keeps Slack native progress streams to one task card per exec call, ending duplicate rows that made active agent runs harder to read."
coverImage: '/assets/images/posts/openclaw-2026-9-10-slack-native-progress-cards.png'
date: '2026-09-10T23:01:00.000Z'
dateFormatted: September 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-10-slack-native-progress-cards.png'
---

OpenClaw's Slack native progress stream should be quieter and easier to trust after a late September 10th merge.

[PR #143879](https://github.com/openclaw/openclaw/pull/143879), titled `fix(channels): Slack native progress shows two task cards for one exec call`, merged at 22:58 UTC. The fix targets a visible annoyance in Slack: one `exec` tool call could render as two native task cards, with the first card stuck on the generic start state while the second carried the real command completion.

The bug did not mean the command ran twice. It was a presentation problem in the progress stream. But for anyone monitoring a busy OpenClaw run from Slack, duplicate cards made the transcript noisier and could make a normal command sequence look suspiciously busy.

## What Changed

The root cause was an identity mismatch inside the shared progress compositor. OpenClaw represents related tool-call events with separate item identities, such as a tool item and a command item. The compositor already knew those events belonged to one logical progress line through a correlation key, but the merged line could take the id of whichever event replaced it most recently.

Slack keys native task rows by that line id. When the id changed mid-call, Slack opened another row and completed the old one. The result was a pair of task cards for a single command.

The fix keeps the original line id stable while still updating the line's content and status as later command events arrive. In practical terms:

- One exec call now maps to one Slack native task card.
- The card can move from in progress to complete or error in place.
- Later command output still updates the same logical row.
- Quiet progress mode can clear correlated failures when a later successful event arrives.
- Other channels continue rendering the shared progress line text.

## Why It Matters

Progress UI is not cosmetic when an agent is doing real work. It is how users decide whether a run is alive, stuck, duplicated, failed, or recovered.

Slack is also one of OpenClaw's most important remote control surfaces. A duplicated task card per command can turn five ordinary commands into ten visual rows. That makes the transcript harder to scan and makes it easier to miss the one row that actually needs attention.

This PR tightens the connection between the internal event model and the user-facing stream. The agent can still report detailed command activity, but the Slack view now treats one logical operation as one visible operation.

## Validation

The PR includes before-and-after evidence using the real progress line builders, the Slack progress chunk builder, and the native task reconciler. Before the change, the reproduction produced two Slack task row ids for one exec call. After the change, it produced one task id from start to completion.

The author also reports focused channel and Slack tests, broader channel suites for Matrix, Telegram, Discord, and Microsoft Teams, formatting and lint checks, changed-file gates, and live Slack validation in a test workspace.

For Slack-heavy OpenClaw users, this is a small fix with a big readability payoff. The transcript now better reflects what actually happened: one command, one progress card.
