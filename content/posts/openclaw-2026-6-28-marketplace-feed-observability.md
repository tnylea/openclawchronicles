---
title: "OpenClaw Marketplace Feed Gains Better Readbacks"
excerpt: "OpenClaw added marketplace feed entries and telemetry commands, giving operators clearer readbacks without exposing raw feed secrets."
coverImage: '/assets/images/posts/openclaw-2026-6-28-marketplace-feed-observability.png'
date: '2026-06-28T23:02:00.000Z'
dateFormatted: June 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-28-marketplace-feed-observability.png'
---

OpenClaw's hosted marketplace feed work gained two more operator-facing pieces on Sunday. [PR #96158](https://github.com/openclaw/openclaw/pull/96158) added `openclaw plugins marketplace entries`, and [PR #96194](https://github.com/openclaw/openclaw/pull/96194) added diagnostics telemetry for marketplace feed refresh and entries commands.

This builds on the hosted catalog and snapshot fallback work covered earlier in the week. The bigger arc is clear: OpenClaw is moving marketplace data from a bundled-only catalog toward feed-shaped, profile-aware, observable marketplace sources that operators can inspect and troubleshoot.

## The New Entries Command

The `plugins marketplace entries` command gives users an explicit read path over the configured OpenClaw marketplace feed. It lists normalized feed entries and reports where the data came from: a fresh hosted payload, an accepted hosted snapshot, or bundled fallback data.

The command supports `--feed-profile`, `--feed-url`, `--offline`, and `--json`. That matters because marketplace behavior needs to be inspectable in both automated and air-gapped workflows. An operator should be able to ask, "What entries would this OpenClaw instance see right now?" without forcing a network fetch every time.

The PR's proof used offline bundled fallback mode and showed a JSON response with source metadata, an entry count, and normalized install metadata. The example reported 74 bundled fallback entries.

## Telemetry Without Raw Secrets

The follow-up telemetry PR adds opt-in diagnostics timeline marks for both marketplace feed refresh and entries operations. The event attributes are intentionally bounded. They can record command type, source mode, entry count, offline mode, HTTP status, snapshot use, feed sequence, checksum presence, and coarse fallback categories.

Just as important, the PR says it avoids writing raw feed URLs, URL hosts, profile names, feed IDs, payload checksums, URL credentials, query strings, fragments, and override token values into diagnostics timeline attributes.

That is the right shape for marketplace observability. Operators need to know whether a feed was fetched, reused, rejected, or served from fallback. They do not need diagnostics logs to become a second copy of sensitive feed configuration.

## Why This Matters

Marketplace feeds are becoming part of OpenClaw's supply-chain surface. A trustworthy feed system needs more than a fetch call. It needs:

- Manual refresh and manual read commands.
- Snapshot fallback when hosted data is unavailable or unchanged.
- Profile and source validation.
- Redacted telemetry for debugging production behavior.
- JSON output that other tools can consume.

These two PRs do not complete the whole marketplace trust story by themselves, but they make the system easier to operate. The entries command tells users what OpenClaw sees. The telemetry tells diagnostics-aware environments how the feed lifecycle behaved.

## Validation

The entries PR included formatting, linting, focused CLI tests, TypeScript core checks, MDX docs checks, whitespace checks, and Codex review. The telemetry PR added focused tests proving diagnostics are emitted and that host, ID, checksum, profile-like values, and raw URL secrets are not written into timeline events.

For plugin-heavy OpenClaw installs, this is a useful step: marketplace data is becoming easier to inspect without loosening the privacy boundary around where that data came from.
