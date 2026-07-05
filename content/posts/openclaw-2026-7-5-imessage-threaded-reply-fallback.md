---
title: "OpenClaw iMessage Fix Protects Threaded Replies"
excerpt: "OpenClaw now falls back to plain iMessage sends when threaded replies are unsupported and scopes recovery cursors per chat database."
coverImage: '/assets/images/posts/openclaw-2026-7-5-imessage-threaded-reply-fallback.png'
date: '2026-07-05T23:02:00.000Z'
dateFormatted: July 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-5-imessage-threaded-reply-fallback.png'
---

OpenClaw merged [PR #100446, "fix(imessage): plain-send fallback for threaded replies + db-scoped recovery cursor"](https://github.com/openclaw/openclaw/pull/100446), a P1 message-delivery fix for iMessage deployments that use the AppleScript transport or move between chat databases.

The PR focuses on two failure modes from a dedicated bot-user and SSH-wrapped iMessage setup. Both had the same user-facing result: OpenClaw appeared to be working, but messages could vanish at the delivery or inbound recovery boundary.

## What Changed

The first fix protects outbound replies. When OpenClaw tried to send a threaded iMessage reply through a transport that did not support `reply_to`, the send path could hard-error. The PR changes that behavior so OpenClaw retries once without the thread reference and delivers the message unthreaded instead.

That fallback covers both text and media replies because both travel through the same send path. The receipt also reports the unthreaded send that actually happened, rather than pretending the original threaded reply succeeded.

The second fix scopes the iMessage downtime recovery cursor by database identity. Previously, the cursor was keyed per account. If an operator pointed `dbPath` at a different `chat.db` with lower row IDs, OpenClaw could reuse a stale high-water mark and silently skip new inbound messages.

Now the cursor is keyed by account plus database identity, with local paths canonicalized so the implicit default path and explicit spellings of the same database map together.

## Why It Matters

iMessage support often runs in real-world macOS setups with private API constraints, SSH wrapping, bot users, and database paths that change during maintenance. Those are exactly the setups where a delivery system needs graceful degradation.

Threading is useful, but it is less important than delivering the answer. If the bridge cannot honor a thread reference, an unthreaded message is still a successful user-visible reply.

The database cursor change is just as important for operators. Moving between a default user database, a bot-user database, or a remote host should not permanently wedge inbound replay because an old cursor belongs to a different message store.

## Validation

The PR reports 92 passing tests across the touched iMessage send, recovery-cursor, and monitor route files. It also reports clean `pnpm tsgo:extensions` and `pnpm tsgo:extensions:test` runs.

The live proof is stronger than the unit coverage alone. The author tested a real two-Mac SSH deployment, reproduced the `reply_to requires bridge transport` failure against the real `imsg` binary, and verified that stripping `reply_to` delivered through AppleScript. The same proof showed the fixed recovery cursor being re-scoped into a database-specific key.

## Bottom Line

OpenClaw's iMessage path now treats unsupported threading as a degradation, not a dropped reply. It also stops one chat database's recovery cursor from suppressing another database's inbound messages.
