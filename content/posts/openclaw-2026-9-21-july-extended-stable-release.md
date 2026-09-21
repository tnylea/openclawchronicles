---
title: "OpenClaw 2026.7.35 Revives the July LTS Line"
excerpt: "OpenClaw 2026.7.35 brings the July extended-stable line back with Doctor registry repair, security backports, and gateway reliability fixes."
coverImage: '/assets/images/posts/openclaw-2026-9-21-july-extended-stable-release.png'
date: '2026-09-21T23:00:00.000Z'
dateFormatted: September 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-21-july-extended-stable-release.png'
---

OpenClaw has a fresh extended-stable release: [v2026.7.35](https://github.com/openclaw/openclaw/releases/tag/v2026.7.35). It is not a replacement for the current regular stable line, which the release notes identify as 2026.9.5. Instead, this is the July maintenance branch catching an important gateway-only repair after an audit of the prior extended-stable cursor.

The release describes extended-stable as OpenClaw's current LTS-equivalent track. That framing matters for operators who prefer slower-moving production systems but still need critical security, reliability, and compatibility fixes.

## What Changed

The headline fix is Doctor plugin registry recovery. According to the release notes, Doctor now preserves the full bundled plugin inventory when it creates or repairs registry state. That keeps default plugins such as Browser, Canvas, pairing, file transfer, phone control, Talk voice, and Bonjour available after restart.

The release also says state-migration discovery can recover from partial registry state written by 2026.7.34 while preserving external plugin install records. In plain English: if an extended-stable install got into a half-repaired plugin-registry state, this build is meant to recognize and repair that shape without discarding locally installed plugin records.

## Why This Release Is Notable

OpenClaw 2026.7.35 is the first GitHub Release for the July maintenance line after 2026.7.33 and 2026.7.34 were marked as unstable extended-stable builds and not published as GitHub Releases. Because of that, the v2026.7.35 page carries the cumulative July extended-stable notes as well.

Those cumulative notes cover several broad backport categories:

- Security and credential-safety hardening around command parsing, browser origins, plugin Git installs, diagnostics, service credentials, and webhook logging.
- Message and session integrity fixes across retries, hooks, recovery paths, imports, streamed replies, and channel lifecycle transitions.
- Gateway reliability improvements for failed HTTP and Responses streams, bounded reads, history queries, and shutdown settlement.
- Channel-delivery repairs across Discord, Matrix, Telegram, Slack, WhatsApp, LINE, Feishu, Zalo, and meeting-plugin paths.
- Provider and media robustness work around bounded requests, malformed payload rejection, and response lifecycle preservation.

That is a maintenance release, but not a tiny one. The release notes say the cumulative July record spans 126 merged PRs for the 2026.7.33 baseline, while 2026.7.35 itself was selected after a 1,418-commit audit from the prior cursor.

## Who Should Care

Teams on the current regular stable line should keep following 2026.9.5 unless they intentionally operate the extended-stable track. The release page is explicit that 2026.9.5 remains the current latest OpenClaw version.

For operators pinned to the July line, though, 2026.7.35 is the important one to evaluate. It gives that branch a published GitHub Release, repairs a concrete Doctor plugin-registry issue, and bundles the published cumulative notes for the July maintenance line into one official reference point.

The short version: OpenClaw's LTS-equivalent channel just got a cleaner recovery story for bundled plugins, plus a clearer release page explaining what the extended-stable track is for.
