---
title: "OpenClaw 2026.5.10: Discord Voice Gets a Full Realtime Overhaul"
excerpt: "OpenClaw 2026.5.10 ships realtime agent-proxy voice for Discord, private skill archive uploads, and a Node 22.16+ minimum floor."
coverImage: '/assets/images/posts/openclaw-2026-5-10-discord-voice-realtime.webp'
date: '2026-05-10T23:00:00.000Z'
dateFormatted: May 10th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-10-discord-voice-realtime.webp'
---

OpenClaw dropped two releases today — `v2026.5.10-beta.1` at 2:02 PM UTC and `v2026.5.10-beta.2` at 6:18 PM UTC — and the headliner is impossible to miss: Discord voice has been completely overhauled with a full realtime agent-proxy mode. Alongside that, a new private skill archive install path and a raised Node.js minimum floor round out a release that touches nearly every corner of the platform.

## Discord Voice Is Now Realtime by Default

The biggest change in 2026.5.10 is that **agent-proxy is now the default voice mode** for Discord. Previously, voice channels ran as a simple STT/TTS pipeline; now OpenClaw acts as the microphone-and-speaker extension of the routed agent session, with the old STT/TTS mode remaining as an explicit fallback via `voice.mode: stt-tts`.

Three distinct realtime modes are now available with `/vc`:

- **STT/TTS** — classic speech-to-text in, text-to-speech out, lowest latency for simple setups
- **Realtime talk buffer** — routes live voice through an OpenClaw agent brain with barge-in detection
- **Bidi realtime** — full bidirectional session using `openclaw_agent_consult`, the most powerful option for complex agent interactions

New voice diagnostics (`voice.captureSilenceGraceMs`, barge-in detection, speaker-turn tracking, playback-reset logging) ship alongside these modes to help operators diagnose choppy audio. The default post-speech silence grace has been extended to 2.5 seconds, which should meaningfully reduce choppy cut-offs in typical Discord rooms.

For echo-heavy environments, operators can now set `interruptResponseOnInputAudio: false` to prevent server VAD speech-start events from clearing playback mid-sentence. Explicit Discord barge-in for new or active speakers remains available as an opt-in.

## Private Skill Archive Uploads

A long-requested operator feature lands in 2026.5.10: [PR #74430](https://github.com/openclaw/openclaw/pull/74430) adds a gated install path for private, zip-backed skills. When you set `skills.install.allowUploadedArchives: true` in your gateway config, trusted clients can upload and install a `.zip` skill archive directly — no ClawHub listing required.

This is an explicitly opt-in surface with the note that it is a **code-install surface** and should only be enabled for trusted gateway clients. Self-hosted operators who ship internal skills (automations, company-specific tools, or unreleased experiments) are the clear target audience.

## Node.js Minimum Floor: 22.16+

OpenClaw now requires **Node 22.16 or newer** ([PR #78921](https://github.com/openclaw/openclaw/pull/78921)). The change was made to rely on the `node:sqlite` statement metadata API introduced in that version. Node 24 remains the recommended runtime.

If you are running an older Node 22.x release, this is the update to check before. The release notes recommend Node 24 for production, but any 22.16+ build is technically supported.

## xAI Grok Gets Proper Reasoning Controls

xAI Grok reasoning-capable models now expose `/think low|medium|high` ([#79210](https://github.com/openclaw/openclaw/pull/79210)), and `reasoning.effort` is correctly forwarded on native Responses payloads. A separate fix ensures OpenAI-style reasoning effort controls are *not* sent to native Grok Responses models — the previous behavior caused `xai/grok-4.3` to fail with "Invalid reasoning effort" in live Docker runs.

## Realtime Voice Instructions for Operators

A new config field, `talk.realtime.instructions` ([PR #79081](https://github.com/openclaw/openclaw/pull/79081)), allows operators to append custom realtime voice style instructions to an agent's system prompt without replacing OpenClaw's built-in agent-consult guidance. This is useful for tuning tone, vocabulary, or persona in voice deployments without touching the core agent config.

## Other Notable Fixes

- **Gateway config reload:** Config is now re-read from disk after the first in-process restart loop, fixing a bug where `SIGUSR1` restarts reused a stale startup snapshot and dropped config written after boot ([#79947](https://github.com/openclaw/openclaw/issues/79947)).
- **Control UI PWA:** Root PWA and favicon assets are now correctly served from `/__openclaw__/` SPA routes, fixing 404s after internal navigation ([#80072](https://github.com/openclaw/openclaw/issues/80072)).
- **CLI config persistence:** Explicit `config set` values that equal runtime defaults are now actually persisted instead of silently dropped ([#79856](https://github.com/openclaw/openclaw/issues/79856)).
- **OpenAI-compatible models:** A new `compat.strictMessageKeys` option strips replay messages to `role` and `content` for strict providers that reject OpenAI-style tool and metadata keys ([#50374](https://github.com/openclaw/openclaw/issues/50374)).
- **Telegram duplicate replies:** The canonical final assistant answer is now delivered instead of accumulated pre-tool text blocks, ending a long-standing bug that caused duplicate Telegram replies ([#79621](https://github.com/openclaw/openclaw/issues/79621)).
- **Docker/tini:** The runtime image now runs under `tini` for correct signal forwarding and orphan process reaping ([#77885](https://github.com/openclaw/openclaw/issues/77885)).

## Dependency Refreshes

The release refreshes a wide swath of the dependency tree, including ACPX `@agentclientprotocol/claude-agent-acp` 0.33.1, Codex ACP 0.14.0, Baileys 7.0.0-rc10, Google GenAI 2.0.1, OpenAI 6.37.0, AWS SDK 3.1045.0, and Kysely 0.29.0.

---

Full changelogs for [v2026.5.10-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.5.10-beta.1) and [v2026.5.10-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.5.10-beta.2) are on GitHub. The Node 22.16+ floor is the one breaking change to act on before updating.
