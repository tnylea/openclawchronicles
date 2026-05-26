---
title: "OpenClaw iMessage Media Pipeline Gets Two Key Fixes"
excerpt: "Two open PRs from Omar Shahine address long-standing iMessage media bugs: attachments the image tool couldn't read, and group media that failed to send."
coverImage: '/assets/images/posts/openclaw-2026-5-26-imessage-media-fixes.png'
date: '2026-05-26T08:00:00.000Z'
dateFormatted: May 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-26-imessage-media-fixes.png'
---

If you use OpenClaw on a Mac with iMessage, two frustrating media bugs are finally getting the attention they deserve. A pair of pull requests from contributor Omar Shahine — [#86569](https://github.com/openclaw/openclaw/pull/86569) and [#86770](https://github.com/openclaw/openclaw/pull/86770) — tackle distinct but related failure modes in the iMessage channel's media pipeline, and together they patch a gap that's been tripping up Mac users for months.

## Bug #1: The Image Tool Couldn't Read Received Attachments

PR #86569, "Fix iMessage image attachment roots," resolves a long-standing regression tracked in [issue #30170](https://github.com/openclaw/openclaw/issues/30170).

The problem: when iMessage saves a received attachment to `~/Library/Messages/Attachments/`, OpenClaw's image tool would reject it with a `path-not-allowed` error — even though the channel's inbound path policy explicitly included the wildcard `/Users/*/Library/Messages/Attachments`. The wildcard was configured correctly, but the image tool was ignoring it, falling back to workspace-only literal roots.

The fix passes the current channel and account context into media loading so the image tool checks the same inbound path policy that iMessage monitoring already uses. Wildcard segments like `/Users/*/Library/Messages/Attachments` are now matched correctly, without widening the global local-roots allowlist.

Omar Shahine provided live proof on macOS 25.4.0 / Apple Silicon: before the patch, the policy throws `LocalMediaAccessError: path-not-allowed`; after the patch, the same path resolves cleanly. Seven test files covering 187 tests all pass.

## Bug #2: Group Media Sends Were Silently Broken

PR #86770, "send group media via attachment command," fixes the other half of the iMessage media story: sending media *to* group chats.

On current main, all media sends go through the generic RPC `send` path. That works fine for direct messages but breaks for group chats — the group attachment simply doesn't deliver correctly via RPC. The fix adds a preferred `send-attachment --transport auto` path for media-only sends to explicit chat targets, with fallback to the existing RPC send for cases where the advanced command is unavailable (older installs, capability checks that fail, etc.).

The ClawSweeper bot rated this one 🐚 platinum hermit — the highest readiness tier short of exceptional — and it's now sitting at "ready for maintainer look." Regression tests cover chat GUID sends, chat ID resolution, the unavailable-command fallback, bad JSON rejection, and DM media continuing to use the existing path.

## Why These Matter Together

Separately, each PR fixes a real annoyance. Together, they close an end-to-end media loop:

- **Receiving:** you can now ask OpenClaw to describe or analyze an image someone sent you in iMessage — the image tool will actually find the attachment.
- **Sending:** when your agent generates or fetches an image and wants to send it to a group thread, it now lands as a proper attachment instead of failing silently.

This is the kind of plumbing work that doesn't show up in big release notes but makes the iMessage channel meaningfully more reliable for everyday use.

## What to Expect

Neither PR is merged yet as of this writing. PR #86569 has live behavior proof attached and is awaiting maintainer merge. PR #86770 is ready for maintainer review after the fallback commit addressed the ClawSweeper finding. Both are straightforward in scope and should land in an upcoming beta drop soon.

Mac users who want to track progress can follow both PRs directly on GitHub. If you've been hitting `path-not-allowed` errors when asking OpenClaw about images in your Messages app, #86569 is the one to watch.
