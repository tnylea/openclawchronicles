---
title: "OpenClaw Fixes Telegram Rich Captions"
excerpt: "OpenClaw PR #171180 converts rich Telegram media-caption blocks into native caption formatting instead of leaking literal tags into chats."
coverImage: '/assets/images/posts/openclaw-2026-10-13-telegram-caption-formatting.png'
date: '2026-10-13T23:15:00.000Z'
dateFormatted: October 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-13-telegram-caption-formatting.png'
---

OpenClaw merged [PR #171180](https://github.com/openclaw/openclaw/pull/171180), a Telegram formatting fix for rich media captions. With rich Telegram messages enabled, photo and document captions could display literal block tags instead of clean native formatting.

The broken cases were familiar rich-message shapes: lists, checkboxes, asides, and dividers. Instead of seeing a readable caption, users could see raw markup-like tags, compact items jammed together, doubled checklist markers, or lost list numbering.

That is the kind of polish bug that makes an otherwise capable agent feel rough at the exact moment it is sending something visible to another person.

## What Changed

PR #171180 moves rich caption handling to the shared caption owner. Authored rich blocks are projected into Telegram-friendly caption text while preserving generated numbering and indentation through Markdown rendering.

The fix also reuses OpenClaw's existing quote-aware HTML tokenizer and attribute parser. That matters because Telegram captions are constrained: the formatter needs to convert genuinely authored structure while preserving literal examples and escaped tags that the user meant to show as text.

The PR specifically preserves:

- Enclosing list counters.
- Compact list item separation.
- Checklist markers without doubling ordinary bullets.
- Native inline formatting.
- Literal code and escaped tag examples.
- Asides mapped to supported blockquote formatting.

Long captions keep the existing behavior: when a media caption cannot carry the full rich text, OpenClaw can send a separate rich-text follow-up instead of truncating the content.

## Why Telegram Captions Are Tricky

Telegram media captions are not the same as ordinary text messages. They have length limits, supported entity types, and different rendering behavior around photos and documents. A renderer that works for a normal chat message can still produce awkward output when the same rich block is attached to media.

That is why this fix is scoped. It does not rewrite every Telegram rendering path. It handles media-caption projection where the bug occurred, and it keeps plain captions, code examples, and escaped markup stable.

The result should be captions that look authored rather than leaked from the renderer's internal representation.

## Verification

The PR includes unusually concrete Telegram evidence. The author ran a focused formatter suite with 67 passing tests, then compared a baseline and candidate using Telegram Test Server and a TDLib userbot with `richMessages: true`.

The same results were observed for photos and documents. Compact lists became separate bullet lines, nested lists retained outer numbering and child indentation, checklists had exactly one checkbox marker per item, quotes became native blockquotes, and code examples stayed literal.

The PR also reports changed-file formatting and lint passing, plus a real-provider CLI gate returning `OPENCLAW_CAPTION_LIVE_OK`.

## Why It Matters

Telegram is one of the places where OpenClaw's output becomes immediately social. A malformed caption is not just ugly; it can make an agent look careless in a channel, group, or workflow where the message is meant to be consumed by humans.

Rich captions are especially important for media-heavy tasks: summaries with screenshots, generated images, document delivery, checklist-style status reports, and structured updates. Those messages need bullets, quotes, and checklist states to survive the trip into Telegram.

## Bottom Line

PR #171180 makes Telegram rich media captions much more trustworthy. OpenClaw now converts common rich blocks into native caption formatting, preserves literal examples when users mean them literally, and keeps long-caption handling intact.

For Telegram users, the visible difference should be simple: fewer raw tags, cleaner captions, and media messages that look like they were meant for the conversation they landed in.
