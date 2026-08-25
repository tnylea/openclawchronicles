---
title: "OpenClaw Progress Cards Add Last Activity Timestamps"
excerpt: "OpenClaw progress cards now show accessible last activity times and reject malformed timestamps before they can crash the UI."
coverImage: '/assets/images/posts/openclaw-2026-8-25-progress-card-activity.png'
date: '2026-08-25T23:04:00.000Z'
dateFormatted: August 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-25-progress-card-activity.png'
---

OpenClaw's shared session progress cards picked up a small but useful visibility upgrade tonight with [PR #129520](https://github.com/openclaw/openclaw/pull/129520). The change adds a true last-activity timestamp to the card surfaces where operators track active work, and it hardens timestamp parsing so malformed values cannot crash the UI.

Progress cards already told users that work existed. The missing piece was recency. Without a visible activity time, an operator could not quickly tell whether a card represented a currently advancing task or stale work that had stopped moving.

## What Changed

The fix renders the existing canonical Gateway-backed `updatedAt` field in the shared progress-card owner. It uses OpenClaw's localized absolute-time formatter with seconds precision and emits a semantic `<time datetime>` element.

The last-activity value now appears across the card's placement surfaces:

- Board
- Composer
- Dock
- Hovercard
- Rail

The same activity information is also included in the parent accessible label, so screen readers can discover it even where a summary already has an explicit `aria-label`.

## A UI Fix With a Parser Fix

The PR also repairs the owner boundary that admits progress-card timestamps from Gateway responses. Incoming timestamps are now validated with OpenClaw's canonical `asDateTimestampMs` helper, and both GET and PUT responses go through the same parser.

That matters because a schema-valid integer can still be too large or too small for JavaScript date handling. Before this change, an out-of-range value could reach `toISOString` and crash all card placements. Now malformed timestamps are rejected before cache updates or rendering.

The recovery path is user-friendly: an invalid dismissal response shows the existing localized retry toast, preserves the previously safe card and timestamp, and allows the next valid retry to succeed.

## Why It Matters

This is not a flashy feature, but it improves a daily operator loop. When OpenClaw is juggling long-running work, operators need fast answers to simple questions: did this task just advance, or has it been quiet for a while? The timestamp turns that from guesswork into visible state.

The accessibility angle matters too. A progress-card summary that only works visually leaves screen-reader users without the same state. By moving the activity time into semantic markup and accessible labels, the card becomes more useful without adding another placement-specific implementation.

## Validation

The PR reports fail-before coverage across all five placements and a real Chromium composer screenshot showing the missing timestamp. After the fix, fifteen parser-owner and placement renderer tests passed, covering valid Date-boundary timestamps, positive and negative overflow rejection, GET and PUT ingress, and preservation of the previous safe cache after an invalid PUT.

Three real mocked-Gateway Chromium E2E scenarios also passed across 1600 px dock, 1280 px rail, and 560 px composer layouts. Those checks covered visible time, semantic ISO datetime, parent accessible names, markdown-only cards, clipping behavior, a malicious PUT, the visible retry toast, safe-card retention, and successful recovery.

The resulting production change is modest: 13 lines of production code, one documentation line, and a focused regression suite. That is the right kind of UI hardening for a shared component used in several parts of the OpenClaw interface.
