---
title: "OpenClaw Fixes Slack Thread Delivery Drift"
excerpt: "OpenClaw merged a P1 Slack delivery fix that records Slack's canonical root thread, helping agents keep replying after restarts."
coverImage: '/assets/images/posts/openclaw-slack-canonical-thread-fix.png'
date: '2026-06-20T08:05:00.000Z'
dateFormatted: June 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-slack-canonical-thread-fix.png'
---

OpenClaw merged a focused P1 Slack fix this morning: [PR #95250, "fix(slack): record canonical sent thread"](https://github.com/openclaw/openclaw/pull/95250). It targets a subtle but important message-delivery edge case in threaded Slack conversations.

The short version: when OpenClaw sent a message into a Slack thread, it could record the requested child thread timestamp instead of the canonical root thread timestamp that Slack actually returned. That mismatch meant OpenClaw's thread-participation state could point at the wrong key.

In a persistent agent, that matters. If a person replied later in the real root thread without mentioning the bot, OpenClaw could skip the message because its participation lookup missed the canonical thread where the conversation was actually happening.

## What Changed

The PR changes OpenClaw's Slack send path so `chat.postMessage` receipts and participation records prefer Slack's returned `message.thread_ts`. The requested `threadTs` is still used as the outbound API target, but the state OpenClaw keeps is now based on the canonical delivered thread when Slack provides one.

The fix covers:

- Text sends
- Chunked text sends
- Block and card sends
- Fallback behavior when Slack does not return canonical thread metadata

The PR is careful not to overclaim file-upload behavior. Its body notes that upload-only canonicalization is not covered because the upload helper currently returns only the file id.

## Why It Matters

Slack threading is one of those areas where "mostly right" state is not enough. OpenClaw agents often participate in long-running work threads where the user may stop mentioning the bot after the first message. The agent needs durable proof that it has joined that exact Slack thread, even across a gateway restart.

The root cause described in the PR is direct: OpenClaw recorded participation from `opts.threadTs`. When Slack accepted a child reply timestamp but canonicalized the delivered message into the root thread, OpenClaw persisted the child key instead of the root key.

That is the kind of bug that only appears after several normal-looking steps: a threaded send, Slack canonicalization, later unmentioned replies, and a participation lookup. It is also exactly the kind of bug that makes chat agents feel flaky in real use.

## The Verification Is Strong

This patch carries more than unit tests. The PR reports targeted Vitest coverage across five Slack-related test files, with 163 tests passing, plus a clean autoreview and `git diff --check`.

More importantly, the author added live Slack behavior proof from an installed OpenClaw instance patched with the PR's Slack changes. In that proof, a root thread was mentioned once, later replies in the same thread omitted the bot mention, and OpenClaw continued replying after a gateway restart.

The diagnostic case is especially useful: OpenClaw deliberately sent through `sendMessageSlack()` with a child reply timestamp, Slack delivered into the canonical root thread, and OpenClaw recorded only the root participation key. The PR body summarizes the validated behavior as recording the canonical root thread id instead of persisting the child timestamp when Slack canonicalizes the request.

## Bottom Line

This is not a headline-grabbing feature, but it is a high-value reliability fix for teams running OpenClaw in Slack. Thread participation is the difference between an agent that stays present in a workstream and one that silently misses follow-up context.

For Slack-heavy OpenClaw deployments, [PR #95250](https://github.com/openclaw/openclaw/pull/95250) is worth tracking in the next release notes.
