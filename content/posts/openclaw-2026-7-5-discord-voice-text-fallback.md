---
title: "OpenClaw Discord Voice Replies Fall Back to Text"
excerpt: "OpenClaw now sends visible Discord text when voice-note delivery fails, preventing final replies from disappearing silently."
coverImage: '/assets/images/posts/openclaw-2026-7-5-discord-voice-text-fallback.png'
date: '2026-07-05T08:02:00.000Z'
dateFormatted: July 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-5-discord-voice-text-fallback.png'
---

OpenClaw merged [PR #89962, "fix(discord): fall back to text when voice delivery fails"](https://github.com/openclaw/openclaw/pull/89962), a Discord delivery fix focused on one frustrating failure mode: a final answer that was generated, routed, and then lost when voice-note delivery failed.

The PR describes a real local OpenClaw Discord setup where a final reply attempted to go out as a voice note. When the voice path failed, no visible text fallback was sent. From the user's perspective, the agent simply never answered.

## What Changed

The Discord outbound path still tries voice-note delivery first when `audioAsVoice` is enabled. The difference is what happens after a failure.

If voice delivery rejects and visible text is available, OpenClaw now sends that text to Discord. If the visible text was previously stripped into a hidden text-to-speech supplement, OpenClaw can use that supplement as the fallback text instead.

The change is intentionally scoped to the Discord payload path. It does not redesign media sending, voice conversion, or unrelated voice behavior. It only covers the final payload boundary where a voice reply is attempted and then fails before the user sees anything.

## Why The Edge Case Matters

Voice replies are a nice channel feature, but they are not more important than answer delivery. Discord voice-note conversion can fail for ordinary operational reasons: audio conversion errors, missing or misbehaving media tooling, invalid inputs, or runtime environment differences.

Before this PR, a failure at that point could swallow the entire final reply. That is worse than a degraded experience. It breaks trust because the agent did the work but the channel never shows the result.

The new fallback behavior changes the priority order:

- Prefer the voice-note experience when it succeeds.
- Preserve the reply target when falling back.
- Avoid duplicate text when a supplement was already delivered visibly.
- Send plain text rather than dropping the answer.

That is the right tradeoff for a messaging integration. A text answer is still an answer.

## Validation

The PR includes live behavior proof from a real Discord bot and private test channel. The patched path was run with `audioAsVoice: true`, visible fallback text, and deliberately invalid audio input so the voice conversion step failed.

After the forced voice failure, OpenClaw posted the fallback text. Fetching the message back from Discord returned status 200, matching content, zero attachments, and a normal message type. That confirmed the result was a text fallback rather than a voice attachment.

The test suite now covers four regression cases:

- falling back to visible text when Discord voice delivery rejects
- falling back to hidden TTS supplement text when visible text was stripped for voice delivery
- preserving the reply target during fallback
- suppressing duplicate TTS supplement text when it was already visibly delivered

The author also reports `CI=true pnpm test extensions/discord/src/outbound-adapter.test.ts`, TypeScript checking, `pnpm test:extension discord`, and a clean Codex review.

## Bottom Line

OpenClaw's Discord voice mode now fails softer. If a voice note cannot be delivered, users should still see the final answer as text instead of wondering whether the agent vanished.
