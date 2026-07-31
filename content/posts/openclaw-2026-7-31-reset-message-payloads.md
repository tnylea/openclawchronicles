---
title: "OpenClaw Preserves Reset Message Payloads"
excerpt: "OpenClaw now keeps raw reset payloads intact across Telegram and reset-trigger flows, preventing command parsing from rewriting user text."
coverImage: '/assets/images/posts/openclaw-2026-7-31-reset-message-payloads.png'
date: '2026-07-31T08:03:00.000Z'
dateFormatted: July 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-31-reset-message-payloads.png'
---

OpenClaw merged a P1 session-state fix this morning for reset commands that carry a message payload. [PR #116195](https://github.com/openclaw/openclaw/pull/116195), titled `fix(session): preserve reset message payloads`, repairs a case where `/new <message>`, `/reset <message>`, and configured reset triggers could corrupt the text that should seed the new session.

The affected inputs were exactly the kinds of messages users are likely to send when they need a clean start: bracketed text, multiline code, logs, mention-wrapped commands, and channel-specific structural wrappers. OpenClaw could correctly detect the reset command, but the payload retained after the reset came from normalized projections rather than the current raw inbound content.

In plain terms: the command parser was doing its job, but its cleaned-up view of the message was being reused as if it were the original user text.

## Root Cause

Reset detection intentionally normalizes input. It may strip mentions, wrappers, bracketed metadata, and whitespace so that commands are recognized consistently across channels.

That normalized view is useful for deciding whether a reset command was sent. It is not safe as the source of truth for the message the user wanted to keep.

PR #116195 splits those responsibilities. Detection now uses the canonical command projection, while payload extraction comes from the raw inbound projection for the current message. The full and fast initialization paths also share one session-owned parser, reducing the chance that reset behavior diverges depending on how a session starts.

## Why This Is A P1 Fix

Reset commands are often used when the previous context is wrong, stale, or too noisy. If the first message in the replacement session is rewritten, OpenClaw can start the new conversation with damaged intent.

That is particularly painful for support, operations, and coding workflows where the reset payload may contain:

- fenced code blocks
- copied logs
- commands with punctuation
- channel mentions around the assistant name
- structured text pasted from another tool

Preserving the exact payload makes the reset path predictable. Users can clear context and immediately hand OpenClaw the real task without worrying that transport cleanup changed their message.

## Validation

The PR carries `proof: sufficient`, `P1`, `merge-risk: compatibility`, and `merge-risk: session-state` labels. It also includes visible Telegram proof coverage, which is important because Telegram command and mention handling often exposes projection bugs first.

For operators, the practical takeaway is simple: reset-triggered sessions should now begin with the text the user actually sent, not the sanitized text OpenClaw used internally to recognize the command.
