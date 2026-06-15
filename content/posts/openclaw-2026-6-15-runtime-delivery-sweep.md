---
title: "OpenClaw Fixes Cron, Media, and Chat Delivery Edges"
excerpt: "OpenClaw merged a reliability sweep for cron control replies, WhatsApp media failures, Discord voice calls, session rollover, and media cleanup edge cases."
coverImage: '/assets/images/posts/openclaw-2026-6-15-runtime-delivery-sweep.png'
date: '2026-06-15T23:01:00.000Z'
dateFormatted: June 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-15-runtime-delivery-sweep.png'
---

OpenClaw's second major Monday night theme was runtime delivery polish: cron messages should stay quiet when they are control tokens, media failures should tell the user, voice consult errors should not crash the gateway, and long-running model calls should not look stalled before they actually are.

No single pull request here changes the product headline. Together, they make OpenClaw feel less brittle in the exact places operators notice: chat delivery, scheduled jobs, media attachments, long model calls, and automatic session rollover.

## Cron Replies Get Quieter

[PR #85471](https://github.com/openclaw/openclaw/pull/85471) fixes a cron delivery leak where token-only control replies such as `NO_REPLY`, `ANNOUNCE_SKIP`, and `REPLY_SKIP` could still reach external channels during announce or direct delivery. The fix routes cron announce/direct delivery through the shared suppressed-control-reply predicate before sending outbound payloads.

That matters because cron jobs often run unattended. A scheduled job that correctly decides not to speak should not leak its internal control word into Discord, Slack, Telegram, or any other delivery target. The PR keeps the older leading/trailing `NO_REPLY` cleanup behavior while moving the suppression decision earlier in the delivery path.

## Media and Voice Failures Get Clearer

Two channel fixes landed within minutes of each other.

[PR #93334](https://github.com/openclaw/openclaw/pull/93334) changes WhatsApp media delivery so a failed non-first media attachment no longer disappears silently. Before the patch, a reply with multiple attachments could deliver the first item, fail on a later item, log the problem server-side, and give the recipient no indication that something was missing. The fix sends a short fallback notice when trailing media is unavailable.

[PR #93308](https://github.com/openclaw/openclaw/pull/93308) handles malformed realtime consult calls from Google's Realtime voice provider without crashing Discord voice handling. The PR description is blunt about the bug: a malformed realtime consult tool invocation could crash the entire gateway. The intended outcome is simple: return a tool error and keep the gateway alive.

OpenClaw also merged [PR #90846](https://github.com/openclaw/openclaw/pull/90846), which removes destructive legacy cleanup from `saveMediaSource`. The old path ran a hardcoded two-minute media cleanup on every media save and could delete unrelated attachments and generated images under first-level `media/` directories. Cleanup is now left to the configured maintenance timer.

## Sessions and Diagnostics Settle Down

[PR #92575](https://github.com/openclaw/openclaw/pull/92575) preserves user behavior overrides across automatic daily or idle session rollover. The affected settings include `/think`, `/verbose`, `/reasoning`, `/trace`, and auto-TTS. Those survived explicit `/new` sessions but could be dropped when rollover happened automatically, reverting to defaults without user action.

[PR #88062](https://github.com/openclaw/openclaw/pull/88062) improves runtime diagnostics for slow or silent model calls. Instead of immediately reporting `session.stalled` when an owned `model_call` is active but quiet, OpenClaw now classifies that period as `session.long_running` until the configured abort threshold. Real stalled recovery still exists; the difference is that normal slow model behavior should stop looking like a gateway failure.

Two UI and operator-facing fixes round out the sweep. [PR #93006](https://github.com/openclaw/openclaw/pull/93006) keeps stderr visible when a TUI local shell command's stdout fills the output cap, preserving the failure reason at the tail of output. [PR #93349](https://github.com/openclaw/openclaw/pull/93349) keeps Workboard card titles visible when a column overflows by letting the column scroll instead of compressing card rows until titles vanish.

## Operator Takeaway

This is the kind of post-release work that usually shows up as "stability fixes" in a changelog, but the details are meaningful. Cron jobs stay silent when they should. Users learn when WhatsApp media failed. Discord voice errors are contained. Media retention obeys the configured cleanup path. Session preferences survive automatic rollover. Diagnostics distinguish slow model calls from real stalls.

If you run OpenClaw as an always-on assistant rather than a one-off demo, these are the fixes that reduce surprise.

Read the source PRs on GitHub: [#85471](https://github.com/openclaw/openclaw/pull/85471), [#93334](https://github.com/openclaw/openclaw/pull/93334), [#93308](https://github.com/openclaw/openclaw/pull/93308), [#90846](https://github.com/openclaw/openclaw/pull/90846), [#92575](https://github.com/openclaw/openclaw/pull/92575), [#88062](https://github.com/openclaw/openclaw/pull/88062), [#93006](https://github.com/openclaw/openclaw/pull/93006), and [#93349](https://github.com/openclaw/openclaw/pull/93349).
