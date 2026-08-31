---
title: "OpenClaw LINE Quotes Now Honor Mention Policy"
excerpt: "OpenClaw's LINE integration now lets operators disable quote-as-mention activation in groups without changing explicit mention behavior."
coverImage: '/assets/images/posts/openclaw-2026-8-31-line-quote-mention-policy.png'
date: '2026-08-31T08:02:00.000Z'
dateFormatted: August 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-31-line-quote-mention-policy.png'
---

OpenClaw's LINE channel now respects the existing implicit mention policy for bot quotes. PR #133619 fixes a compatibility bug where quoting a bot message in a LINE group could wake the agent even when an operator had set `channels.defaults.implicitMentions.quotedBot: false`.

For group deployments, this is a small but important control. Many OpenClaw channels support `requireMention` so the agent only responds when explicitly addressed. Quote-as-mention is useful by default, but some teams want a stricter room where quoting a prior bot answer remains ambient context instead of starting a new turn.

Official source: [PR #133619](https://github.com/openclaw/openclaw/pull/133619).

## What Was Broken

LINE already produced the quote fact and already used OpenClaw's shared ingress gate. The missing piece was the resolved `implicitMentions` policy.

Without that allowlist, the shared mention gate had nothing to filter against, so every produced quote fact counted. In practical terms, `channels.defaults.implicitMentions.quotedBot: false` was read but did not affect LINE quote activation.

The PR also notes that the fix does not add a new LINE-specific configuration key. The existing shared default is the intended setting, and LINE's account schema remains strict.

## What Changed

The LINE integration now passes the existing resolved policy into the shared mention gate through `resolveChannelImplicitMentions`, matching the pattern already used by Slack, Mattermost, and Tlon.

Defaults stay enabled. Operators who never changed implicit mention settings should see no behavior change. Operators who disable quote-as-mention get the stricter behavior they configured:

- A real explicit mention can still activate the bot.
- A quoted bot message can remain ambient chatter when `quotedBot` is disabled.
- Skipped group text is still retained in group history for context.
- Docs now state that LINE reads the shared default policy.

## Real Group Proof

The PR includes live LINE group evidence. With the default setting, quoting the bot admitted a turn. With `quotedBot: false` set before Gateway startup, the same native quote gesture was skipped under `requireMention`. On unchanged main with the flag set, the quote still admitted a turn, proving the old behavior ignored the policy.

Maintainer validation added regression tests for default, enabled, disabled, and explicit-mention behavior. The revised LINE CI job passed 48 files and 721 tests, including all handler and join-introduction cases, and exact-head CI succeeded.

## Why It Matters

Mention policy is one of the safety valves for group chat agents. The difference between "this quote should wake the bot" and "this quote should only preserve context" can decide whether a busy room stays calm or an agent keeps jumping into side conversations.

By routing LINE through the same policy path as other channels, OpenClaw makes group behavior more predictable. The fix also keeps the control centralized, which helps operators reason about policy once instead of memorizing per-channel exceptions.

