---
title: "OpenClaw Fixes Silent Mic Failure in the Control UI Chat"
excerpt: "A Permissions-Policy header was quietly blocking the Control UI mic button for all users. PR #68368 unlocks same-origin microphone access so voice input finally works."
coverImage: '/assets/images/posts/openclaw-2026-4-18-control-ui-mic-fix.png'
date: '2026-04-18T08:00:00.000Z'
dateFormatted: April 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-18-control-ui-mic-fix.png'
---

If you've ever clicked the microphone button in OpenClaw's Control UI chat and watched it silently reset — no error, no recording, nothing — you weren't imagining things. A years-old Permissions-Policy header was blocking browser microphone access for the page itself.

[PR #68368](https://github.com/openclaw/openclaw/pull/68368) by contributor **visionik**, merged April 18th, finally closes [issue #51085](https://github.com/openclaw/openclaw/issues/51085) and restores working voice input to the dashboard.

## What Was Broken

OpenClaw's gateway sets a suite of security headers on its HTTP responses, including a `Permissions-Policy` header. The problem: that header included `microphone=()`, which is the most restrictive setting possible. It tells the browser to deny microphone access to **every** origin — including the page itself.

When the Control UI's `speech.ts` tried to start the browser's Web Speech API, it hit an immediate policy wall:

```
Permissions policy violation: microphone is not allowed in this document
```

The mic button would silently reset. No feedback, no fallback. Users running voice-based workflows were left in the dark.

## The Fix

The solution is surgical. Rather than opening up microphone access broadly, the new policy sets `microphone=(self)` — the same-origin allowlist. The gateway's own web interface can now use the Web Speech API, while third-party frames remain fully blocked.

Camera and geolocation stay at their existing deny-all settings. The change is narrowly scoped to the one capability that OpenClaw's Control UI actually needs.

```
Before: Permissions-Policy: microphone=()
After:  Permissions-Policy: microphone=(self)
```

## What You Get

- **Voice input works again** in the Control UI chat panel
- No browser warnings, no silent resets
- Third-party iframes remain blocked from accessing your microphone
- Full test coverage added: unit tests assert the new same-origin policy, fuzz tests cover invariants across all HTTP response helpers

The PR also ships a comprehensive test suite for `src/gateway/http-common.ts` — 33 unit tests plus 13 fuzz-style property tests — bringing that module to 100% line, branch, function, and statement coverage.

## How to Get It

This fix is in-flight toward the next OpenClaw release. Track it on the [GitHub releases page](https://github.com/openclaw/openclaw/releases). If you're building from main, it's in now.

If voice input matters to your workflow, this one's worth pulling early.
