---
title: "OpenClaw Fixes iMessage Remote Media for Codex"
excerpt: "OpenClaw now stages remote iMessage attachments before Codex dispatch, so chat image workflows receive local media instead of Mac paths."
coverImage: '/assets/images/posts/openclaw-2026-6-28-imessage-remote-media-staging.png'
date: '2026-06-28T08:01:00.000Z'
dateFormatted: June 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-28-imessage-remote-media-staging.png'
---

OpenClaw's iMessage integration picked up a high-priority media fix for plugin-bound Codex workflows. [PR #91803](https://github.com/openclaw/openclaw/pull/91803), merged June 28 at 02:36 UTC, stages remote iMessage media before OpenClaw builds Codex inbound-claim metadata.

The bug affected a very real multi-device setup: iMessage attachments can arrive with `MediaRemoteHost` metadata and raw macOS Messages paths, such as files under a remote Mac's `Library/Messages/Attachments` directory. If Codex received those paths before OpenClaw staged them, the model-facing input could point to a file path that was not readable from the runtime doing the work.

## What Changed

The fix stages remote inbound iMessage media earlier for plugin-bound Codex claims. Instead of handing Codex a raw remote Mac attachment path, OpenClaw now uses cache-mode staging and passes a local cached `localImage` path into the turn input.

The normal reply path stays single-stage. Ordinary non-plugin remote iMessage media still stages later in `get-reply`, so this change is targeted at the plugin-bound dispatch path that needed earlier media availability.

The PR also improves hook metadata. When a `message_received` hook fires before staging has run, OpenClaw now omits live `mediaPath` and `mediaUrl` fields, then includes metadata such as `mediaStagingPending`, `mediaRemoteHost`, and the original media fields. That gives hook consumers an explicit contract instead of a path that looks usable but is not.

## Why It Matters

Remote iMessage setups are common for operators who keep Messages on a Mac but run parts of OpenClaw elsewhere. In those environments, "what is this image?" should not fail because the attachment path belongs to another machine.

The user impact is straightforward:

- Codex gets staged local image paths for plugin-bound iMessage claims.
- Raw remote Messages attachment paths stop leaking into Codex input.
- Hook consumers can detect pending remote-media staging.
- The existing non-plugin reply path keeps its current staging behavior.

This is the kind of channel reliability work that does not look flashy, but it removes a sharp edge from daily agent use. If your agent is expected to inspect screenshots, photos, receipts, or other attachments from iMessage, path locality is the difference between a useful answer and a confusing miss.

## Validation

The PR included a near-real remote iMessage `MediaRemoteHost` proof using OpenClaw's actual remote staging path, an isolated state directory, and a local SCP-compatible shim. The observed result showed the plugin-bound claim rewritten from a raw remote Mac path to a staged remote-cache path before Codex input was built.

OpenClaw also validated focused dispatch regressions, hook mapper behavior, SCP remote-cache staging, Codex turn-input handling, formatting, lint, and whitespace checks before merge.

