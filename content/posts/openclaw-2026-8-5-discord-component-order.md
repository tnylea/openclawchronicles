---
title: "OpenClaw Preserves Discord Component Order"
excerpt: "OpenClaw PR #119506 keeps Discord presentation controls where authors placed them instead of moving buttons below all text."
coverImage: '/assets/images/posts/openclaw-2026-8-5-discord-component-order.png'
date: '2026-08-05T08:03:00.000Z'
dateFormatted: August 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-5-discord-component-order.png'
---

OpenClaw merged [PR #119506, "fix(discord): preserve authored block order in presentation components"](https://github.com/openclaw/openclaw/pull/119506), a Discord channel fix for messages that interleave text, dividers, buttons, and selects.

The bug affected OpenClaw's Discord Components V2 presentation builder. An agent could author a message as text, then buttons, then a trailing note. The builder would emit all prose first and all controls last, so the note jumped above the buttons and the controls sank to the bottom.

For interactive messages, order is meaning. A result summary, action buttons, and a follow-up warning can read very differently if the warning moves above the buttons.

## One Pass Instead Of Two

The root cause was a two-pass builder. It first collected text, context, and divider blocks, then appended buttons and selects afterward. That meant authored order could never interleave, even though Discord Components V2 allows text, separators, and action rows to be mixed.

PR #119506 changes the presentation builder to render blocks in a single order-preserving pass while keeping the title behavior pinned. Presentations that were already prose-then-controls remain byte-identical. Only messages that intentionally put text, context, or dividers after controls change.

That is the right kind of compatibility fix: existing simple layouts stay stable, while richer authored layouts finally render as written.

## User Impact

The change improves Discord messages that behave like small workflows:

- Build-result cards with buttons followed by a skipped-test note.
- Approval prompts with controls in the middle of a multi-section message.
- Select-first forms that include explanatory text after the select.
- Messages that use dividers to group controls with nearby context.

Before the fix, those layouts could look scrambled. After the fix, controls sit exactly where the presentation author placed them.

This is especially useful for OpenClaw agents that send structured operational messages into Discord. The more a message acts like an interface, the more its block order needs to be stable.

## Evidence

The PR includes a real proof script against `buildDiscordPresentationComponents`. On main, an authored `[text, buttons, text]` presentation rendered as text, text, actions. With the fix, it rendered as text, actions, text.

Validation passed 21 tests in `extensions/discord/src/shared-interactive.test.ts`, including the new regression test `preserves authored block order around controls`. The author also ran a red-green check by stashing the source change to confirm the new test fails on the old behavior and passes with the fix.

For Discord users, the result is straightforward: OpenClaw presentation components now respect authored layout order, so action controls and the text around them stay connected.
