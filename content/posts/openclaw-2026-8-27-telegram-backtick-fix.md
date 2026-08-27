---
title: "OpenClaw Fixes Telegram Inline Code Backticks"
excerpt: "OpenClaw now preserves literal edge backticks in Telegram inline code across messages, captions, and polls, keeping agent input accurate."
coverImage: '/assets/images/posts/openclaw-2026-8-27-telegram-backtick-fix.png'
date: '2026-08-27T08:05:00.000Z'
dateFormatted: August 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-27-telegram-backtick-fix.png'
---

Telegram users who send code to OpenClaw just got a small but important accuracy fix. A newly merged OpenClaw PR, [#130800](https://github.com/openclaw/openclaw/pull/130800), repairs how the Telegram channel preserves literal backticks inside native inline-code formatting.

The issue was subtle: when a user selected Telegram monospace text that began or ended with a backtick, OpenClaw's presentation layer could lose those literal edge characters or produce a broken code span before the text reached the agent. That matters because backticks are not decoration in many developer workflows. They can be part of shell snippets, Markdown samples, template strings, or diagnostic text that an agent needs to see exactly.

## What Changed

The merged fix keeps the repair inside the Telegram presentation producer. According to the PR, the encoder already selected a delimiter longer than the longest backtick run in the content, but edge backticks could still join with the delimiter without padding.

The update computes one padding value for content that starts or ends with a space or backtick and applies it consistently on both sides. The PR says this preserves literal backticks selected as Telegram monospace text in:

- Regular message text
- Document captions
- Poll descriptions

The change does not alter OpenClaw's core input normalization, message routing, authentication, persistence, configuration, or public SDK contracts. It also keeps existing whitespace behavior and preformatted block handling unchanged.

## Why It Matters

OpenClaw is often used in chat surfaces where users paste logs, snippets, commands, and small pieces of structured text. Telegram native formatting should not change the payload's meaning before the agent sees it. A missing backtick can turn a Markdown example into malformed syntax or make an instruction harder to reason about.

This is especially relevant for users who treat Telegram as a lightweight operator console. If they send a code fragment from mobile, the exact characters should survive the trip from Telegram to the Gateway to the model provider request.

## Validation

The PR includes a focused evidence section. Before the change, its regression table failed five edge-backtick cases while ordinary and internal-backtick controls passed. After the fix, the focused run passed 152 tests across six files, covering text and caption offsets, buffered replies, media carriers, and prompt context.

The author also tested a real built Gateway consuming Telegram `getUpdates` through grammY and forwarding requests to a local mock model provider. The assertions inspected the raw provider request rather than a summarized prompt, which is the right place to prove that the agent input is preserved.

The PR notes that live Telegram SaaS and Desktop were not exercised. The evidence is still meaningful because it uses the real Gateway/channel pipeline with local external endpoints and directly checks the provider request body.

## Bottom Line

This is not a flashy feature release, but it is exactly the kind of channel fidelity fix that makes OpenClaw feel dependable in daily use. If Telegram is part of your OpenClaw workflow, inline code that includes literal edge backticks should now arrive intact without any operator action.
