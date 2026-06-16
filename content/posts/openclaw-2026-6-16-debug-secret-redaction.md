---
title: "OpenClaw Closes Debug Secret Redaction Gap in Chat"
excerpt: "OpenClaw PR #93333 redacts secret-shaped runtime debug overrides before /debug show and /debug set responses reach chat-visible output in shared channels."
coverImage: '/assets/images/posts/openclaw-2026-6-16-debug-secret-redaction.png'
date: '2026-06-16T08:01:00.000Z'
dateFormatted: June 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-16-debug-secret-redaction.png'
---

OpenClaw merged a small but important security fix this morning: [PR #93333](https://github.com/openclaw/openclaw/pull/93333) redacts secret-shaped values before `/debug show` and `/debug set` output is rendered back into chat.

The bug was a sibling of an earlier `/config` redaction fix. OpenClaw already routed `/config show` and `/config set` through schema-aware redaction, but the adjacent `/debug` command path could still display runtime override values directly. That mattered because debug overrides can include secret-shaped paths such as gateway auth tokens or channel bot tokens.

## What Was Exposed

The PR description says `/debug show` previously serialized the runtime override tree into chat-visible output, and `/debug set` echoed the value it had just stored. Those overrides are memory-only, but that did not make the output safe. A secret does not need to be written to disk to leak if it appears in a channel transcript.

The affected path was narrow: process-local runtime overrides handled by the auto-reply command code. But the output surface was broad enough to care about because OpenClaw agents are often operated through chat channels where command responses can be visible to humans, logs, or downstream tooling.

## What Changed

PR #93333 updates `/debug show` to redact the override tree before rendering it, using the same config redaction helpers already used by `/config show`. It also updates `/debug set` acknowledgements to reuse the existing formatting helper that redacts secret-shaped values before confirming a set operation.

The patch is deliberately contained. It touches one source file plus focused tests, preserves non-secret fields, and keeps environment-placeholder behavior aligned with the existing redaction logic.

The PR's validation is unusually direct. The author exercised real exported runtime override functions and the real debug command handler with a standalone script, confirming that plaintext secrets remained present in memory but were replaced with the redaction sentinel in chat-visible output. The regression tests then covered both `/debug show` replies and `/debug set` acknowledgements.

## Why It Matters

OpenClaw's command surfaces need consistent secret handling. Operators should not have to remember which command family is safe to inspect from chat and which one might echo sensitive runtime state. A mismatch between `/config` and `/debug` is exactly the kind of edge that shows up during troubleshooting, when people are already copying command output around.

The fix also reinforces a broader security pattern: internal state can remain useful for runtime behavior while external renderers aggressively redact it. That distinction lets OpenClaw keep flexible debug overrides without turning chat transcripts into accidental credential dumps.

## Operator Takeaway

If you use runtime debug overrides for gateways, channels, providers, or agent behavior, PR #93333 is worth tracking. It does not remove the ability to set or inspect debug overrides. It changes what gets shown back to the chat surface when those values look like secrets.

Until the next packaged release includes the patch, avoid posting `/debug show` output from older builds into shared channels if runtime overrides may contain credentials. Read the merged fix on GitHub: [OpenClaw PR #93333](https://github.com/openclaw/openclaw/pull/93333).
