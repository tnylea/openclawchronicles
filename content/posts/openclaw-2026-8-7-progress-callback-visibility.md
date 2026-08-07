---
title: "OpenClaw Preserves Progress Visibility"
excerpt: "OpenClaw PR #120171 makes channel progress callbacks acceptance-aware, so visible updates stay retry-safe across Discord, Matrix, Slack, and more."
coverImage: '/assets/images/posts/openclaw-2026-8-7-progress-callback-visibility.png'
date: '2026-08-07T23:01:00.000Z'
dateFormatted: August 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-7-progress-callback-visibility.png'
---

OpenClaw merged [PR #120171, "fix(progress): preserve callback acceptance results"](https://github.com/openclaw/openclaw/pull/120171), a broad channel reliability change for progress updates across Discord, Matrix, Slack, Telegram, WhatsApp Web, Signal, iMessage, Mattermost, Microsoft Teams, Feishu, and QQBot.

The change targets a subtle but important piece of agent UX: when an agent shows partial progress, the runtime needs to know whether that update was actually accepted by the channel. Without that signal, OpenClaw could treat pending or rejected progress as if it had already become visible.

That is how progress indicators become misleading. Worse, it can make the next retry look like a duplicate instead of an update that still needs to be delivered.

## What Changed

The PR formalizes a backward-compatible progress callback contract: `true` means the update was accepted and visible, `false` means it was not visible or remains pending, and legacy `void` callbacks continue to count as visible for compatibility.

OpenClaw now preserves that result through follow-up turns, direct-run wrappers, ordered typing and presentation paths, embedded and CLI callback mirrors, and compositor boundaries. The compositor also records its dedupe baseline only after an accepted render.

In practice, that means a channel can reject or delay a progress update without poisoning the retry path. Discord and Matrix now return `false` until their draft or message is acknowledged. Slack commits chunk keys, task snapshots, reply-plan state, and delivery facts only after delivery is confirmed by the session layer.

## Why Operators Should Care

Progress updates are not final answers, but they shape how users perceive a live agent. If a long-running task appears to be moving and then silently stalls, the operator loses confidence in both the task and the channel.

This fix gives OpenClaw a more honest foundation for those in-between states. Accepted updates can be deduped safely. Unaccepted updates remain retryable. Legacy plugins continue working without needing an immediate SDK rewrite.

That balance matters for a system with many channels. A Discord preamble, a Matrix draft, a Slack progress chunk, and a terminal partial all have different delivery mechanics. The runtime now carries their acceptance result instead of flattening them into one vague success path.

## Validation

The PR reports 204 focused tests passing across two Vitest shards, plus a passing exact changed gate and a clean structured autoreview. It also updates the Plugin SDK channel documentation and generated contract artifacts.

For OpenClaw users, PR #120171 is a delivery-quality fix rather than a flashy feature. It makes progress visibility more truthful, and that is exactly the kind of reliability work that keeps always-on agents feeling dependable.
