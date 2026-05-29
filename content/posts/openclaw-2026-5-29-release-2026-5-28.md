---
title: "OpenClaw v2026.5.28: iOS Overhaul, ClawPDF, and Runtime Fixes"
excerpt: "OpenClaw v2026.5.28 ships a full iOS Pro UI refresh, ClawPDF integration, ClawHub trust surfaces, and dozens of agent runtime reliability fixes."
coverImage: '/assets/images/posts/openclaw-2026-5-29-release-2026-5-28.png'
date: '2026-05-29T08:00:00.000Z'
dateFormatted: May 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-29-release-2026-5-28.png'
---

OpenClaw [v2026.5.28](https://github.com/openclaw/openclaw/releases/tag/v2026.5.28-beta.1) landed in the early hours of May 29th as a pre-release, and it's one of the more packed builds in recent memory. The headliners are a fully rebuilt iOS Pro app, native ClawPDF integration, ClawHub skill trust surfaces, and a wave of agent runtime stability fixes that address some long-standing Codex edge cases.

## iOS Gets a Full Rebuild

The biggest user-facing change in this release is the iOS app. Thanks to contributor [@Solvely-Colin](https://github.com/Solvely-Colin), the iOS dev app has been refreshed with four dedicated tabs — **Pro Command**, **Chat**, **Agents**, and **Settings** — all wired directly to gateway sessions, diagnostics, real-time chat, and Talk. This is a significant step toward a production-grade mobile experience, with each tab surfacing live gateway state rather than static configuration screens.

## ClawPDF Is Now in Core

OpenClaw now uses [ClawPDF](https://github.com/openclaw/openclaw/pull/87670) for PDF extraction, replacing the previous ad-hoc approach. More importantly, structured MCP content now surfaces in agent tool results when processing PDFs. If your workflows involve document analysis or research pipelines that ingest PDFs, this is a meaningful quality-of-life improvement — agents get richer, structured data rather than raw text dumps.

## ClawHub Skill Verification and Trust Surfaces

Two PRs ([#87354](https://github.com/openclaw/openclaw/pull/87354) and [#86699](https://github.com/openclaw/openclaw/pull/86699)) bring **plugin display names** and **skill verification and trust surfaces** to ClawHub. Contributors [@thewilloftheshadow](https://github.com/thewilloftheshadow) and [@Patrick-Erichsen](https://github.com/Patrick-Erichsen) delivered this work. Catalog and package listings now show cleaner names, and skills surface trust metadata — a meaningful step for users who want to audit what they're installing.

## Agent and Codex Runtime Recovery

A cluster of fixes addressed reliability issues in the agent and Codex runtimes:

- **Subagent cwd/workspace separation** — spawned agents no longer bleed workspace state into each other ([#87218](https://github.com/openclaw/openclaw/pull/87218))
- **Hook context is now prompt-local** — prevents hook contamination across turns ([#86875](https://github.com/openclaw/openclaw/pull/86875))
- **Session locks release on timeout abort** — no more stuck sessions after timeouts ([#87409](https://github.com/openclaw/openclaw/pull/87409))
- **Stale restart continuations are avoided** — fixes edge cases where agents would resume incorrect state after restarts ([#87399](https://github.com/openclaw/openclaw/pull/87399))
- **Codex app-server/helper failures no longer tear down shared runtime state** ([#87375](https://github.com/openclaw/openclaw/pull/87375))

Contributors [@mbelinky](https://github.com/mbelinky), [@Alix-007](https://github.com/Alix-007), [@luoyanglang](https://github.com/luoyanglang), [@yetval](https://github.com/yetval), and [@sjf](https://github.com/sjf) drove much of this work.

## Channel Delivery Security

Channel delivery got another round of hardening across multiple surfaces:

- **Outbound plugin hooks** now thread canonical session keys
- **Matrix room-id case** is preserved correctly
- **iMessage** continues polling after denied reactions
- **Slack** retains delivered final replies during late cleanup
- **Microsoft Teams** service URLs are validated for trust before use
- **Discord** recovered tool warnings are now properly suppressed from successful replies

These fixes close several issues that were causing message loss or duplicate sends in production deployments using Slack, iMessage, or Matrix.

## CLI and Auth Improvements

The CLI now rejects malformed numeric and version options at parse time rather than failing silently at runtime. OAuth and local service startup requests are bounded with timeouts. Legacy `api_key` auth profiles are automatically migrated to canonical form, and the `doctor` command provides actionable restart guidance instead of generic error messages.

## Performance and Plugin Caching

[#86699](https://github.com/openclaw/openclaw/pull/86699) brought caching improvements across install records, config JSON parsing, tool search catalogs, session stores, manifest model rows, auto-enabled plugin config, browser tokens, and viewer assets. The result is a Gateway that does less repeated work on hot paths — especially noticeable on setups with many plugins installed.

## Diffs Language Pack

Contributors [@RomneyDa](https://github.com/RomneyDa) split the default language pack and expanded default Diffs language coverage ([#87370](https://github.com/openclaw/openclaw/pull/87370), [#87372](https://github.com/openclaw/openclaw/pull/87372)), keeping the host floor aligned while broadening what the diff viewer can handle natively.

---

The v2026.5.28 npm package is available at [npmjs.com/package/openclaw/v/2026.5.28-beta.1](https://www.npmjs.com/package/openclaw/v/2026.5.28-beta.1). As a pre-release, it's suitable for testing but not yet promoted to the stable channel. The note-worthy pipeline hiccup: the `@openclaw/diffs-language-pack` plugin blocked the ClawHub publish run — that's expected to clear before the stable promotion.
