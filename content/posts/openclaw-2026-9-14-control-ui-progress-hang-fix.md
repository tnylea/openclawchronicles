---
title: "OpenClaw Fixes Control UI Progress Card Hangs"
excerpt: "OpenClaw PR #147528 replaces a costly progress-card regex with a bounded scanner, preventing malformed content from stalling the Control UI."
coverImage: '/assets/images/posts/openclaw-2026-9-14-control-ui-progress-hang-fix.png'
date: '2026-09-14T08:05:00.000Z'
dateFormatted: September 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-14-control-ui-progress-hang-fix.png'
---

OpenClaw merged [PR #147528](https://github.com/openclaw/openclaw/pull/147528), a P1 Control UI fix for progress-card content that could send macOS WebKit into seconds of JavaScriptCore regular-expression work.

The issue is narrow but important. Progress cards are supposed to make active work readable at a glance. If malformed or adversarial card content can tie up the main thread, the UI stops feeling like a control surface and starts feeling like another thing to debug.

## What Changed

The PR replaces a raw-content block regex with a bounded scanner. According to the PR, the old regex repeatedly restarted its closing-tag search for unmatched openers. At the existing 140,000-character markdown limit, the maintainers reproduced the hot path with 17,500 unmatched `<script>` tags.

The new scanner tokenizes candidate tags once, indexes compatible closing tags, and pairs openers with the first valid closer after the opener. The implementation keeps the compatibility details that matter for existing rendering: Unicode case folding, word-boundary behavior, the closing-tag whitespace set, and overlapping-tag pairing semantics.

For users, the intended result is simple: malformed progress-card content should no longer stall the Control UI main thread, while normal progress rendering and sanitization stay the same.

## Why It Matters

This is the kind of bug that shows up at the edge of agentic interfaces. OpenClaw often displays content that originated elsewhere: tools, model output, progress updates, and Gateway events. Even when the content is not malicious, a bad parser shape can turn one unusual payload into a UI pause.

The repair is also a useful example of the OpenClaw team's current pattern: preserve the rendered contract, then change the algorithm under it. The PR does not loosen markdown limits, skip sanitization, or treat malformed content as trusted. It narrows the expensive operation.

## The Proof

The maintainers posted several concrete measurements in the PR:

- On system JavaScriptCore, the current-main regex took 9,462 ms on the 140,000-character payload; the scanner took 5 ms on the same payload and engine.
- In Playwright WebKit 26.6, the mocked-Gateway progress payload took 2,541 ms to open the hovercard before the fix and 908 ms after the change, including the same built-in hover delay.
- After a `progressCard.changed` event, the candidate refreshed the visible card in 25 ms.
- A supplied malformed-closer case of 133,001 characters processed in 1 ms on JavaScriptCore.
- A seeded compatibility check produced identical output for 20,000 mixed raw-content cases.

The PR also includes before and after screenshots and a focused mocked-Gateway E2E flow that sends the full payload through `progressCard.get`, renders the hovercard, emits `progressCard.changed`, and verifies the card updates.

## What To Watch Next

This is not a feature launch, but it is a meaningful reliability hardening for anyone who lives in the Control UI during long-running work. Progress cards are part of the trust loop: users need them to stay responsive exactly when the underlying work is messy.

PR #147528 is now merged, with the source issue closed as [#143713](https://github.com/openclaw/openclaw/pull/147528).
