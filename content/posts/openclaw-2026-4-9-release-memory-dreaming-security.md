---
title: "OpenClaw v2026.4.9: Memory Dreaming, REM Backfill, and Security Hardening"
excerpt: "OpenClaw v2026.4.9 lands with a grounded REM backfill lane for persistent memory, a new diary UI, and multiple security patches including SSRF and dotenv fixes."
coverImage: '/assets/images/posts/openclaw-2026-4-9-release-memory-dreaming-security.png'
date: '2026-04-09T08:00:00.000Z'
dateFormatted: April 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-9-release-memory-dreaming-security.png'
---

OpenClaw shipped **v2026.4.9** today, April 9th 2026, continuing the project's rapid CalVer release cadence. This build is a meaningful one — the memory/dreaming subsystem gets its most significant upgrade in months, the Control UI gains a structured diary view, and a cluster of security fixes tighten the SSRF quarantine, dotenv handling, and node exec event trust boundaries.

Here's everything that changed.

## Memory & Dreaming: REM Backfill Is Here

The headline feature of v2026.4.9 is a **grounded REM backfill lane** for the memory/dreaming subsystem, contributed by [@mbelinky](https://github.com/mbelinky). In plain terms: old daily notes can now replay into Dreams and durable memory without needing a second memory stack.

Previously, the REM harness only operated on forward-flowing memory — whatever an agent accumulated during an active session. Historical diary entries were stranded. The new `rem-harness --path` flag lets you point the harness at a historical path, committing or resetting diary entries and extracting durable facts that feed directly into the live short-term promotion pipeline.

This closes a real gap for long-running agents where weeks of daily notes were inaccessible to the dreaming layer.

### Diary View in the Control UI

Paired with the memory engine changes, the Control UI now ships a **structured diary view** with:

- Timeline navigation through past diary entries
- Backfill and reset controls surfaced inline
- Traceable dreaming summaries so you can audit what facts were promoted
- A grounded Scene lane with promotion hints
- A safe `clear-grounded` action for staged backfill signals

This makes the previously opaque dreaming process observable and manageable — a welcome developer-experience improvement for anyone running persistent agents.

## Provider Auth Aliases

Plugins can now declare `providerAuthAliases` in their manifests, letting provider variants share environment variables, auth profiles, config-backed auth, and API-key onboarding flows without requiring core-specific wiring. This reduces boilerplate for plugin authors building on top of existing provider infrastructure.

## QA/Lab: Character Vibes Reports

The lab tooling gains **character-vibes evaluation reports** with model selection and parallel runs. The intent is faster live QA for comparing candidate agent behavior across model variants — useful for teams iterating on persona tuning.

## iOS: Explicit CalVer Pinning

[@ngutman](https://github.com/ngutman) landed explicit CalVer pinning for the iOS app via `apps/ios/version.json`. TestFlight builds now hold at the same short version until maintainers deliberately promote the next gateway version. The `pnpm ios:version:pin -- --from-gateway` workflow is now documented for release train management. ([#63001](https://github.com/openclaw/openclaw/pull/63001))

## Security Fixes

v2026.4.9 includes five security-related fixes:

**Browser/SSRF quarantine** ([#63226](https://github.com/openclaw/openclaw/pull/63226)) — blocked-destination safety checks now re-run after interaction-driven main-frame navigations triggered by click, evaluate, hook-triggered click, and batched action flows. Previously, browser interactions could navigate to a forbidden URL after the initial check, bypassing the SSRF quarantine.

**Dotenv hardening** ([#62660](https://github.com/openclaw/openclaw/pull/62660), [#62663](https://github.com/openclaw/openclaw/pull/62663)) — runtime-control env vars, browser-control overrides, and skip-server env vars are now blocked from untrusted workspace `.env` files. Unsafe URL-style browser control override specifiers are rejected before lazy loading. Thanks [@eleqtrizit](https://github.com/eleqtrizit).

**Node exec event trust** ([#62659](https://github.com/openclaw/openclaw/pull/62659)) — remote node exec.started, exec.finished, and exec.denied summaries are now marked as untrusted system events. The node-provided command, output, and reason text is sanitized before enqueueing, preventing remote node output from injecting trusted `System:` content into later turns.

**Plugin onboarding auth collision** ([#62368](https://github.com/openclaw/openclaw/pull/62368)) — untrusted workspace plugins can no longer collide with bundled provider auth-choice IDs during non-interactive onboarding. Thanks [@pgondhi987](https://github.com/pgondhi987).

**Dependency audit** — `basic-ftp` is forced to 5.2.1 for the CRLF command-injection fix. Hono and `@hono/node-server` are bumped in production resolution paths.

## Other Fixes

- **Android pairing** ([#63199](https://github.com/openclaw/openclaw/pull/63199)) — stale setup-code auth clears on new QR scans; pairing auto-retry pauses while the app is backgrounded. Scan-once Android pairing should now recover reliably. Thanks [@obviyus](https://github.com/obviyus).
- **Matrix/gateway** ([#62779](https://github.com/openclaw/openclaw/pull/62779)) — gateway now waits for Matrix sync readiness before marking startup successful; fatal sync stops route through channel-level restart handling instead of crashing the whole process. Thanks [@gumadeiras](https://github.com/gumadeiras).
- **Slack/media** — bearer auth is preserved across same-origin `files.slack.com` redirects while being stripped on cross-origin Slack CDN hops, fixing `url_private_download` image loading.

## Upgrading

Update via your standard package manager:

```bash
npm install -g openclaw@latest
# or
pnpm add -g openclaw@latest
```

The full release notes are on [GitHub Releases](https://github.com/openclaw/openclaw/releases/tag/v2026.4.9).
