---
title: "OpenClaw Fixes Telegram Reply Delivery Gaps"
excerpt: "OpenClaw merged Telegram fixes for literal reasoning-like text and long chunked replies, reducing hidden or missing group-chat output."
coverImage: '/assets/images/posts/openclaw-2026-6-28-telegram-reply-delivery-fixes.png'
date: '2026-06-28T23:01:00.000Z'
dateFormatted: June 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-28-telegram-reply-delivery-fixes.png'
---

OpenClaw closed out Sunday with a pair of Telegram delivery fixes aimed at messages that looked sent but were not fully visible to users. [PR #97286](https://github.com/openclaw/openclaw/pull/97286) preserves literal reasoning-looking tags, while [PR #97304](https://github.com/openclaw/openclaw/pull/97304) fixes chunked reply delivery loss in Telegram groups.

Both PRs were merged minutes before the nightly cutoff on June 28, and both carried `P1` priority plus Telegram-visible proof. Together, they make Telegram replies less surprising when the model output contains angle-bracket text or when OpenClaw has to split a long response into multiple messages.

## Literal Text Should Stay Literal

The first fix addresses a parsing boundary. Telegram already sends normal reply text through an HTML-escaped path, but the reasoning-lane coordinator was still guessing that unflagged answer text containing tags such as `<think>` or `<thinking>` should be treated as private reasoning.

That created a product bug: ordinary answer text could be removed from the visible answer path before Telegram's HTML renderer had a chance to escape it safely. The new behavior trusts the typed delivery contract. Only payloads explicitly marked as reasoning go through the reasoning lane; unflagged answer text stays answer text.

For users, that means a response that literally discusses `<think>` tags should show the text instead of disappearing into a channel-local reasoning guess.

## Long Replies Keep Their First Chunk

The second fix targets long Telegram group responses with `streaming.mode: "off"` and `replyToMode: "first"`. In that configuration, Telegram could accept multiple Bot API sends but render the first long formatted native-reply chunk as unsupported in some clients. Users would see later chunks, but not the beginning of the answer.

OpenClaw now centralizes chunk reply policy so multi-part `first` replies consume the reply target without attaching native reply params to every chunk. Single-chunk replies can still use native reply-to behavior. The fix also keeps regular group reply threads from emitting `message_thread_id` as if they were forum topics.

That is an important distinction for Telegram operators because group chats, forum topics, and direct messages all have different threading semantics.

## What Operators Gain

The practical result is better delivery fidelity:

- Literal reasoning-looking text remains visible when it is ordinary answer text.
- Real reasoning payloads still use the separate reasoning lane.
- Long final answers in Telegram groups should show the beginning, middle, and end.
- Multipart delivery receipts now include the relevant Telegram message IDs for bookkeeping.

## Validation

The literal-tag fix included focused tests for Telegram sending, reasoning-lane coordination, formatting, and OpenAI transport streaming. The chunked-delivery fix included 396 passing focused Telegram tests across delivery, helper, bot creation, send, and channel adapter paths.

The real-behavior proof is especially useful here. For the chunked reply case, the PR reports that before the fix the first chunk rendered as unsupported and the `BEGIN` marker was missing. After the fix, three chunks rendered as normal text with `BEGIN`, `MID1`, `MID2`, and `END` all present.

For a chat-first assistant, that is the right bar: not just "the API accepted it," but "the user can actually read it."
