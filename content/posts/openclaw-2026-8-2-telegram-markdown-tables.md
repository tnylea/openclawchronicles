---
title: "OpenClaw Preserves Telegram Markdown Tables"
excerpt: "OpenClaw PR #118257 fixes Telegram native-command replies so Markdown tables are rendered instead of silently disappearing."
coverImage: '/assets/images/posts/openclaw-2026-8-2-telegram-markdown-tables.png'
date: '2026-08-02T23:03:00.000Z'
dateFormatted: August 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-2-telegram-markdown-tables.png'
---

OpenClaw merged [PR #118257, "fix(telegram): stop native commands from silently dropping Markdown tables"](https://github.com/openclaw/openclaw/pull/118257), a P1 Telegram channel fix for table-heavy native-command responses.

The bug was simple to describe and easy to miss in practice: Telegram users running native commands could receive replies where entire Markdown tables were silently removed. If the reply contained only a table, the message could disappear completely. If the reply mixed prose and a table, the prose would arrive while the table vanished.

For a channel used to inspect task output, audits, command results, and generated summaries, silent table loss is a real delivery bug. The channel reports success while the useful part of the answer is gone.

## Root Cause

The PR explains that Telegram had two legacy Markdown-to-HTML parsing paths. One path already translated unsupported `block` tables into visible code blocks. The chunked path, however, passed `block` into the Markdown IR, which extracted tables into blocks that the legacy sender never rendered.

The fix creates one private canonical Telegram parser owner for table-mode normalization. Both paths now preserve the same behavior, and unsupported tables become visible HTML code blocks in the existing Bot API transport.

Importantly, the PR says it changes no configuration or public contract and leaves rich-message delivery untouched. It is a channel rendering fix, not a new Telegram mode.

## User Impact

Telegram native-command replies now preserve:

- table-only responses
- tables between surrounding prose
- existing text around the table
- non-rich Bot API HTML delivery
- both legacy formatter entry points

The practical result is that a command reply containing a Markdown table can be trusted again. Operators do not have to wonder whether a successful Telegram response omitted the most structured part of the output.

## Evidence

The PR includes parent-red proof showing three actual assertion failures before the fix: table-only rendering, mixed prose/table rendering, and the real Telegram `deliverReplies` to Bot API send boundary.

The candidate then passed focused tests for Telegram formatting and delivery, a changed-file gate covering type checks, formatting, lint, boundaries, and import cycles, plus an exact production/plugin build with `OPENCLAW_BUILD_PRIVATE_QA=1 pnpm build`.

The strongest proof is an isolated product run using an ephemeral Gateway, the real Telegram plugin, a loopback Bot API, a mock OpenAI provider, and a native `/new` command against an existing initialized conversation. The intercepted `sendMessage` request contained the full table and surrounding prose with `parse_mode: HTML`.

The PR reports a small production delta: four production lines removed, with focused regression coverage added around the real paths where the table was lost.

This is a good example of a narrow channel fix with outsized operator value. Tables are often where agents put the exact evidence, comparisons, and status rows. Telegram now keeps them visible.
