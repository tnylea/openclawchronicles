---
title: "OpenClaw 2026.6.2 Beta: Operator Install Policy and Channel Hardening"
excerpt: "OpenClaw 2026.6.2-beta.1 replaces the dangerous-code scanner with operator install policy and ships broad channel and security hardening fixes."
coverImage: '/assets/images/posts/openclaw-2026-6-4-v2026-6-2-beta-release.png'
date: '2026-06-04T08:00:00.000Z'
dateFormatted: June 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-4-v2026-6-2-beta-release.png'
---

OpenClaw dropped [2026.6.2-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.6.2-beta.1) late on June 3rd, kicking off the 2026.6.2 release train with a batch of security architecture changes, multi-channel hardening, and UI polish.

## The Biggest Change: Operator Install Policy Replaces Dangerous-Code Scanner

The headlining change in 2026.6.2 is how plugin and skill installs are evaluated. The old "dangerous-code scanner" enforcement path has been replaced with an **operator install policy** system ([#89516](https://github.com/openclaw/openclaw/pull/89516), thanks [@joshavant](https://github.com/joshavant)).

This is a meaningful architectural shift. Rather than trying to scan code for dangerous patterns — a heuristic approach with inherent false positives and gaps — the new system lets operators define an explicit install policy that covers:

- Package installs from npm/ClawHub
- Archive installs from tarballs
- Source installs from local directories
- Upload installs via the UI
- Marketplace installs via ClawHub metadata

The doctor CLI, install/update CLI wiring, and ClawHub metadata paths all align with the new policy model. For operators running self-hosted OpenClaw deployments, this gives much clearer control over what can and cannot be installed — and better diagnostic messages when something is blocked.

## Security and Policy Hardening

Beyond the install policy change, this release adds a layer of defensive checks across config and runtime paths:

- **Reject corrupt shell snapshots** — malformed persisted shell state no longer silently loads
- **Unsupported policy keys** are now caught and rejected instead of silently ignored ([#87056](https://github.com/openclaw/openclaw/pull/87056))
- **Unsafe exec approval precheck environments** are blocked before a run begins ([#89480](https://github.com/openclaw/openclaw/pull/89480))
- **Suspicious gateway startup configs** are detected and rejected at boot ([#89701](https://github.com/openclaw/openclaw/pull/89701))
- **Data-handling conformance checks** added to the policy layer

These changes come from contributors [@RomneyDa](https://github.com/RomneyDa), [@giodl73-repo](https://github.com/giodl73-repo), and [@mmaps](https://github.com/mmaps).

## Multi-Channel Fixes

2026.6.2 addresses a stack of edge cases across the messaging channel layer:

**Telegram** — Telegram admin writeback now requires admin rights. DM exec approval allowlists work correctly with `ask:off`. Preview duplication across streaming modes is fixed. Polling restart storms are throttled. Feishu setup runtime setters are correctly wired.

**Discord** — Channel sends stay durable when transcript mirroring fails. `libopus` error shapes are matched correctly. Internal agent failure traces are hidden from channel output. Tool progress scaffolding is sanitized.

**WhatsApp/outbound** — Schema-padded poll modifiers no longer block normal sends. WebChat `sessions_send` handoffs are preserved.

## Chat and UI

- Visible streaming text is preserved during chat turns
- Stale stream buffers are cleared before terminal commits
- Workboard gets keyboard movement controls (thanks [@vincentkoc](https://github.com/vincentkoc))
- Android companion-first shell navigation is improved
- The Workboard dialog accessibility is hardened
- Usage dashboard lazy-loads instead of blocking startup

## Gateway and Model Reliability

Under the hood, the gateway and agent runtimes get several reliability fixes:

- Session write locks are released when prompt-release fence reads fail ([#89811](https://github.com/openclaw/openclaw/pull/89811))
- Abandoned Codex app-server startups are retired instead of hanging
- `stream-to-parent` ACP spawns stay registered through the spawn lifecycle
- Gemini stop sequences are forwarded correctly to the API
- Kimi-incompatible Anthropic cache markers are stripped before requests

## Installing the Beta

The beta is available on npm now:

```bash
npm install openclaw@2026.6.2-beta.1
```

Or pin it in your package.json:

```json
"openclaw": "2026.6.2-beta.1"
```

Full release verification details — including CI run IDs, npm integrity hash, and E2E Telegram test results — are in the [GitHub release notes](https://github.com/openclaw/openclaw/releases/tag/v2026.6.2-beta.1). The stable 2026.6.2 release will follow once the beta train clears.
