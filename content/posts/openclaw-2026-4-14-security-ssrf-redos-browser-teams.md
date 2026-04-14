---
title: "OpenClaw Security Patches: SSRF, ReDoS, and Allowlist Hardening"
excerpt: "A fresh OpenClaw pre-release drops five targeted security fixes: a ReDoS patch in the Control UI, SSRF enforcement on browser routes, heartbeat trust downgrade, Teams allowlist hardening, and config field redaction."
coverImage: '/assets/images/posts/openclaw-2026-4-14-security-ssrf-redos-browser-teams.png'
date: '2026-04-14T08:00:00.000Z'
dateFormatted: April 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-14-security-ssrf-redos-browser-teams.png'
---

Less than two hours after [v2026.4.12 landed](https://github.com/openclaw/openclaw/releases/tag/v2026.4.12), a new OpenClaw pre-release pushed to GitHub at 02:07 UTC on April 14 — carrying a focused set of security patches that address five distinct attack surfaces. If you run the Control UI, the browser tool, Microsoft Teams, or any setup that processes untrusted webhook events, you want these fixes.

## ReDoS in the Control UI Chat Renderer

The most user-facing fix is a swap of the markdown renderer inside the Control UI. OpenClaw's webchat was using [marked.js](https://github.com/markedjs/marked) to parse assistant markdown responses; a maliciously crafted message with certain regex-heavy patterns could trigger a catastrophic backtrack and freeze the browser tab entirely — a classic [ReDoS (Regular Expression Denial of Service)](https://owasp.org/www-community/attacks/ReDoS) attack.

The fix ([#46707](https://github.com/openclaw/openclaw/pull/46707), thanks [@zhangfnf](https://github.com/zhangfnf)) replaces marked.js with [markdown-it](https://github.com/markdown-it/markdown-it), which does not use backtracking-prone regexes for its core parse paths. Anyone exposing the Control UI to untrusted channels — or running a shared or multi-user gateway — should prioritize this update.

## SSRF Enforcement on Browser Routes

OpenClaw's browser tool (snapshot, screenshot, and tab operations) was not consistently applying the server-side request forgery (SSRF) policy when handling CDP-sourced URLs. Fix [#66040](https://github.com/openclaw/openclaw/pull/66040) ([@pgondhi987](https://github.com/pgondhi987)) enforces the SSRF policy across all three routes.

A companion fix ([#66043](https://github.com/openclaw/openclaw/pull/66043), [#66080](https://github.com/openclaw/openclaw/pull/66080)) also allows the managed local Chrome process's own loopback control plane to bypass SSRF checks — because OpenClaw was incorrectly classifying its own child browser as "not reachable" under strict default policy. The net result: stricter SSRF enforcement for external URLs, working local Chrome management.

## Heartbeat Trust: Untrusted hook:wake Events

[#66031](https://github.com/openclaw/openclaw/pull/66031) ([@pgondhi987](https://github.com/pgondhi987)) forces an owner downgrade for system events arriving via `hook:wake`. Previously, an untrusted wake event could run under elevated owner trust if it happened to match session metadata. The fix clamps such events to non-owner trust before any agent turn executes, preventing a crafted external trigger from gaining escalated permissions inside a heartbeat turn.

## Microsoft Teams: Sender Allowlist on SSO Signin Invokes

Teams integration uses SSO (Single Sign-On) invoke actions for adaptive card interactions. The sender allowlist checks were not being applied to SSO signin invoke paths — meaning a message crafted to look like an SSO invoke could bypass the `allowFrom` filter. Fix [#66033](https://github.com/openclaw/openclaw/pull/66033) ([@pgondhi987](https://github.com/pgondhi987)) enforces allowlist evaluation on this path.

## Config Snapshot: sourceConfig and runtimeConfig Redaction

OpenClaw's `redactConfigSnapshot` function — used when sharing debug state or writing diagnostic output — was not stripping `sourceConfig` and `runtimeConfig` alias fields. These fields can contain provider credentials and channel secrets. Fix [#66030](https://github.com/openclaw/openclaw/pull/66030) ([@pgondhi987](https://github.com/pgondhi987)) ensures both fields are redacted alongside the existing credential redaction paths.

## Feishu Allowlist Canonicalization

A subtler fix ([#66021](https://github.com/openclaw/openclaw/pull/66021), [@eleqtrizit](https://github.com/eleqtrizit)) cleans up how Feishu allowlist entries are matched. Previously, allowlist entries were being case-folded and prefix-stripped inconsistently, which could cause user IDs and chat IDs to collide across namespaces — widening allowlist matches beyond what the operator intended. Entries are now canonicalized by explicit `user`/`chat` kind before matching.

## Other Notable Fixes in This Build

Beyond the security patches, the pre-release includes several operational fixes worth knowing about:

- **Cron scheduler stability** ([#66083](https://github.com/openclaw/openclaw/pull/66083), [#66113](https://github.com/openclaw/openclaw/pull/66113)): The cron engine was inventing short retry loops when no valid future slot could be calculated, and could resume errored jobs too early after a transient failure. Both behaviors are corrected.
- **Gateway session routing** ([#66073](https://github.com/openclaw/openclaw/pull/66073)): Heartbeat, cron-event, and exec-event turns were overwriting shared-session routing metadata, meaning a synthetic heartbeat target could poison later delivery for real user turns.
- **Memory/Active Memory** ([#66144](https://github.com/openclaw/openclaw/pull/66144)): Recalled memories are now placed on the hidden untrusted prompt-prefix path rather than injected into the system prompt, reducing attack surface for memory-poisoning via stored recall.
- **Dreaming sweep guard** ([#66139](https://github.com/openclaw/openclaw/pull/66139)): The dreaming engine now requires a live queued event before running its sweep, preventing it from replaying on later heartbeats after the scheduled run was already consumed.
- **GPT-5.4 compatibility**: The `minimal` thinking preset is now mapped to OpenAI's supported `low` reasoning effort for GPT-5.4 requests, so embedded runs stop failing request validation.

## How to Update

This is a pre-release build. If you want the security fixes now, pull it explicitly:

```bash
npm install -g openclaw@next
```

Or wait for the next stable release, which will include all of these patches. Track the [OpenClaw releases page](https://github.com/openclaw/openclaw/releases) for the stable tag.

The five security-class fixes in this build cover meaningfully different surfaces — UI rendering, browser tool SSRF, event trust, Teams allowlists, and config redaction — making this one of the more security-dense pre-releases in recent months.
