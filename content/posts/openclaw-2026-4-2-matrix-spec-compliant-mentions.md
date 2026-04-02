---
title: "OpenClaw Matrix Agents Now Emit Spec-Compliant Mentions"
excerpt: "OpenClaw agents in Matrix rooms now emit proper m.mentions metadata and matrix.to anchors, so clients reliably highlight and notify mentioned users."
coverImage: '/assets/images/posts/openclaw-2026-4-2-matrix-spec-compliant-mentions.png'
date: '2026-04-02T08:00:00.000Z'
dateFormatted: April 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-2-matrix-spec-compliant-mentions.png'
---

If you have ever sent a message through OpenClaw in a Matrix room and found that the person you tagged never got a notification, you are not alone. Until now, OpenClaw was sending plain Markdown mention text without the accompanying Matrix spec metadata that clients actually use to trigger highlights and push notifications. [PR #59323](https://github.com/openclaw/openclaw/pull/59323) closes that gap entirely.

## What Changed

The fix, contributed by [@gumadeiras](https://github.com/gumadeiras) and merged on April 2, 2026, introduces a proper mention extraction and HTML rendering pipeline for all outbound Matrix messages. Every send path — plain text, media captions, polls, edits, and action-driven edits — now flows through a shared formatting enrichment step that produces two spec-required fields:

- **`m.mentions`** — the structured JSON object listing the Matrix user IDs of everyone mentioned in the message. Matrix clients (Element, FluffyChat, Cinny, etc.) read this field to decide whether to ping a user.
- **`formatted_body` with `matrix.to` anchors** — the HTML representation of the message body, where every `@username` becomes a proper hyperlink to `https://matrix.to/#/@user:server`.

Without both of these, clients treat agent messages as plain text and skip notification routing entirely.

## How Mention Resolution Works

The implementation uses the room's joined-member list to resolve bare localparts to full Matrix IDs. When OpenClaw writes `@alice`, the formatter looks up `alice` across all joined members. If exactly one match is found, a fully qualified `@alice:matrix.org` (or whatever the server is) gets embedded. If the localpart is ambiguous — two users named `alice` from different homeservers — the formatter falls back to safe behavior and emits no anchor rather than mentioning the wrong person.

Mentions inside code spans are intentionally excluded, so a message like "use `@room` in your config" will not accidentally ping every room member.

## Edit and Poll Coverage

The fix also covers the two trickier cases:

- **Edits**: When an agent updates a previously sent message, the formatter computes a mention delta — users newly added in the edit receive `m.mentions`, while users removed from the edit do not get a redundant ping.
- **Polls**: The poll fallback text (sent to clients that do not support the poll event type) now passes through the same enrichment path, so even graceful-degradation messages carry correct mention metadata.

## Why This Matters

Matrix is increasingly used for team workflows, home automation alerts, and multi-agent pipelines where mentions drive routing or human-in-the-loop notifications. An OpenClaw agent that cannot reliably notify people makes those workflows fragile. With this change, any agent wired to a Matrix room behaves the same way a human Matrix client would — mentions land, notifications fire, and conversations stay coherent.

The PR ships with comprehensive test coverage across all send and edit paths, so regressions here will be caught before they reach users.

If you run a Matrix-connected OpenClaw setup, update to the latest main branch or wait for the next tagged release to pick up this fix.
