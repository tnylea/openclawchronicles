---
title: "OpenClaw Authorizes SMS Slash Commands"
excerpt: "OpenClaw SMS direct messages can now invoke text slash commands when the sender is allowlisted or pairing-approved."
coverImage: '/assets/images/posts/openclaw-2026-7-21-sms-slash-commands.png'
date: '2026-07-21T08:02:00.000Z'
dateFormatted: July 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-21-sms-slash-commands.png'
---

OpenClaw's native SMS channel gained a cleaner command path this morning. [PR #90998](https://github.com/openclaw/openclaw/pull/90998), titled "fix(sms): authorize text slash commands," makes SMS direct messages that start with text commands behave like command turns instead of plain chat.

Before the merge, SMS already passed inbound message text through command-oriented fields, but it did not resolve command access or attach structured text-command metadata to the channel context. A message such as `/status` could therefore arrive from an allowlisted or pairing-approved SMS sender and still be treated as ordinary chat text.

The fix brings SMS closer to the behavior OpenClaw already uses in other text-capable channels.

## What Changed

The SMS inbound runtime now includes `channelRuntime.commands`, and the SMS path asks the command runtime whether the raw body should compute command authorization. If the message is an exact control command, OpenClaw attaches explicit command metadata to the inbound context.

The PR makes several narrow changes:

- SMS now resolves command access when a message may need command authorization.
- Exact text slash commands receive `command: { kind: "text-slash" }` metadata.
- Incidental slash-like text, such as a filesystem path, does not become a command turn.
- `access.commands.authorized` is passed into the SMS channel context when relevant.
- The normalized sender number is preserved as `SenderE164` in SMS context extras.

The scope boundary is deliberately small. The PR does not change SMS pairing, sender allowlists, or global command authorization policy.

## Why It Matters

SMS is an important fallback channel for personal automation because it works outside browser sessions, desktop apps, and many chat platforms. If a trusted sender texts `/status`, the expected behavior is that OpenClaw treats the message as a command from that sender, subject to the same authorization checks used elsewhere.

This patch makes that expectation true for native SMS direct messages. It also avoids over-detecting commands. The PR keeps broad command detection separate from exact command-turn metadata, so normal messages that merely contain a slash-like token stay ordinary chat.

For operators experimenting with OpenClaw over SMS, this should make status checks and other Gateway text commands feel less surprising.

## Proof From The PR

The PR includes a real module proof that dispatches an allowlisted `/status` SMS through `dispatchSmsInboundEvent` and inspects the context received by `buildContext`. The copied output showed the command body preserved, `access.commands.authorized` set to true, and a `text-slash` command fact attached to the message.

Regression coverage includes the positive `/status` path and a negative inline-token path for `please inspect /tmp/foo`. The author reports `node scripts/run-vitest.mjs extensions/sms/src/inbound.test.ts` passing, `pnpm test:extension sms` passing 58 tests, formatting and lint checks, two plugin SDK boundary checks, and `git diff --check`.

The PR notes that it did not run a live Twilio or carrier SMS proof. That is a reasonable follow-up for release validation, but the merged code path now has focused local coverage for the inbound authorization handoff.
