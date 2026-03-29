---
title: "OpenClaw Open Groups Now Respond to Images Without Mentions"
excerpt: "A fix merged today makes OpenClaw correctly handle images and media in open-policy groups, ending the silent drop of non-text messages that couldn't carry @-mentions."
coverImage: '/assets/images/posts/openclaw-2026-3-25-open-group-images.png'
date: '2026-03-25T08:00:00.000Z'
dateFormatted: March 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-25-open-group-images.png'
url: '/posts/openclaw-2026-3-25-open-group-images/'
---

If you've configured a group channel with `groupPolicy: open` and wondered why OpenClaw was ignoring images, GIFs, or file uploads — [PR #54058](https://github.com/openclaw/openclaw/pull/54058) explains why, and fixes it.

## The Root Cause

When `groupPolicy` is set to `open`, the intent is clear: OpenClaw should respond to all messages from group members without requiring an @-mention. But there was a mismatch between policy intent and implementation.

Before this fix, `requireMention` defaulted to `true` regardless of `groupPolicy`. Images, GIFs, and other non-text messages physically cannot carry @-mentions — they're binary payloads, not text. So OpenClaw's mention check would always fail for these messages, and they'd be silently dropped. No error. No response. Just nothing.

## The Fix

The fix is a targeted default-resolution change: when `groupPolicy` is `open` **and** `requireMention` is not explicitly set in config, the resolved value is now `false` instead of `true`.

Users who want mention-required behavior even in open groups can still enforce it by explicitly setting:

```yaml
groupPolicy: open
requireMention: true
```

The explicit override is preserved and takes full precedence. The fix only changes the implicit default.

## What Changes for You

If you're running an open-policy group channel — common for internal team bots, Discord servers, or shared Telegram groups — you'll now see OpenClaw respond to:

- Image messages (JPEG, PNG, WebP, etc.)
- GIF and sticker messages (on supported channels)
- File and document uploads
- Any other non-text message type that couldn't previously carry a mention

No config change required. The fix kicks in automatically for any `groupPolicy: open` group where `requireMention` isn't explicitly set.

## Regression Coverage

The PR adds three regression tests:

1. **New default:** `groupPolicy: open` without `requireMention` resolves to `requireMention: false`
2. **Explicit override:** `groupPolicy: open` with `requireMention: true` is respected
3. **Unchanged behavior:** `groupPolicy: allowlist` behavior is unaffected

This closes [issue #52553](https://github.com/openclaw/openclaw/issues/52553), which had been open since the original group policy system shipped. The patch lands in the next OpenClaw release — check the [releases page](https://github.com/openclaw/openclaw/releases) for the tagged version.
