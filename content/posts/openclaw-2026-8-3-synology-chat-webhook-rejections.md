---
title: "OpenClaw Reports Synology Chat Rejections"
excerpt: "OpenClaw PR #118558 makes Synology Chat webhook rejections visible instead of silently acknowledging lost messages or files."
coverImage: '/assets/images/posts/openclaw-2026-8-3-synology-chat-webhook-rejections.png'
date: '2026-08-03T08:04:00.000Z'
dateFormatted: August 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-3-synology-chat-webhook-rejections.png'
---

OpenClaw merged [PR #118558, "fix(synology-chat): report rejected webhook messages and files"](https://github.com/openclaw/openclaw/pull/118558), a P1 channel-delivery fix for Synology Chat.

The issue was a classic transport trap. Synology Chat could return HTTP 200 while still rejecting the message or file in the response body with `{"success":false}`. OpenClaw treated that response as successful delivery, which meant durable delivery could acknowledge a message or attachment that the provider had rejected.

For users, that creates the worst kind of channel bug: the sender sees success, but the message is gone.

## Inspecting The Success Envelope

The fix keeps ownership inside the existing Synology HTTP response path. OpenClaw now inspects the platform's success envelope before declaring delivery complete.

The PR says it reuses the existing bounded response reader and Zod envelope contract, rejects only an explicit boolean `success: false`, preserves current text and file retry ownership, and fully drains oversized responses without creating another transport path.

The production change is deliberately small: two existing files touched, 17 net production lines added, and no new configuration, dependency, public API, persisted-state format, or packaging surface.

## User Impact

Rejected Synology Chat messages and attachments now fail visibly. That gives OpenClaw's normal retry and failure handling a chance to do the right thing instead of recording a false success.

The compatibility scope is also clear. The PR says existing successful responses, empty or non-JSON responses, unrelated response fields, and accepted oversized responses continue working.

That means this is not a strict parsing change that turns every odd response into a failure. It specifically catches the platform saying the request was rejected while still returning HTTP 200.

## Evidence

The PR includes five authenticated red proofs from the unchanged parent, using public and durable Synology text and media adapters with a real localhost Node HTTP server.

On the reviewed head, the proof exercised all four real adapter paths:

- outbound text
- outbound media
- durable text
- durable media
- 25 local HTTP requests

It also preserved the existing retry shape: three attempts for text and one attempt for file behavior.

The verification summary reports 160 passing tests: 40 Synology client-owner tests and 120 sibling tests across channel, real HTTP loopback, webhook, ingress, integration, and security suites. The exact two-file changed gate also passed formatting, lint, type checks, package and plugin boundaries, runtime import cycles, and related guards.

This is narrow but important channel hygiene. OpenClaw now listens to the actual Synology Chat envelope instead of trusting HTTP status alone, which keeps rejected messages from disappearing behind a false delivery receipt.
