---
title: "OpenClaw Beta Brings Grok OAuth, Localization, and 50+ Fixes"
excerpt: "Two betas shipped on May 16 adding xAI Grok OAuth for SuperGrok, Chinese UI localization, Matrix E2EE fixes, and over 50 bug fixes across every layer."
coverImage: '/assets/images/posts/openclaw-2026-5-16-beta-roundup.png'
date: '2026-05-16T23:00:00.000Z'
dateFormatted: May 16th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-16-beta-roundup.png'
---

May 16 was a busy day in the OpenClaw repo. Two pre-release builds — **v2026.5.16-beta.2** (11:29 UTC) and **v2026.5.16-beta.3** (19:46 UTC) — shipped back-to-back, stacking a substantial list of new capabilities and hardened fixes on top of the morning's beta.1.

## xAI Grok OAuth for SuperGrok Subscribers

The headline addition across both betas is native OAuth login for xAI's Grok. SuperGrok subscribers can now authenticate `xai/*` models and xAI media/tool providers directly — no `XAI_API_KEY` environment variable required. This is the same friction-reducing approach OpenClaw has applied to other major providers, and it brings Grok into the first-class citizen tier alongside OpenAI, Anthropic, and Google.

## Chinese Localization Ships

OpenClaw's setup wizard and bundled channel flows now speak three languages: English, Simplified Chinese, and Traditional Chinese ([#80645](https://github.com/openclaw/openclaw/pull/80645), thanks [@GaosCode](https://github.com/GaosCode)). The localization covers the entire onboarding surface, making OpenClaw meaningfully more accessible for the large Chinese-speaking self-hosting community.

## Smarter Skill Caching

Warm gateway turns now cache hydrated `resolvedSkills` keyed by the redacted effective config ([#81451](https://github.com/openclaw/openclaw/pull/81451)). The practical effect: repeated skill lookups within a session no longer rebuild snapshots from scratch, reducing latency on skill-heavy agents without relaxing any config-gated skill boundary.

## Telegram Group Chat Gets Ambient Mode

A new opt-in `messages.groupChat.ambientTurns: "room_event"` setting ([#81317](https://github.com/openclaw/openclaw/pull/81317)) lets always-on Telegram agents process ambient group chatter as quiet room context — speaking visibly only when they invoke the message tool. This is a meaningful quality-of-life improvement for community bots that previously had to choose between full participation and full silence.

## CLI Cron Gets `--wait`

`openclaw cron run` now accepts `--wait` with configurable timeout and poll interval controls, plus exact `cron.runs --run-id` filtering ([#81929](https://github.com/openclaw/openclaw/pull/81929)). Automation scripts can now block on a specific queued manual run rather than polling open-endedly — a long-requested capability for CI and webhook-driven pipelines.

## Codex Context Engine Improvements

The Codex app-server now binds thread-bootstrap projection epochs to app-server threads, carries redacted tool-result context into fresh threads, and rotates backend threads when projection state changes ([#82351](https://github.com/openclaw/openclaw/pull/82351)). Combined with a fix that keeps long-running turns alive while approvals and notifications make progress ([#82601](https://github.com/openclaw/openclaw/pull/82601)), Codex-backed agents should be meaningfully more reliable under heavy workloads.

## Security: Session Data Now Scoped Per Agent

A quiet but important security fix ([#81386](https://github.com/openclaw/openclaw/pull/81386)) scopes session data lookups by agent ID in multi-agent gateway deployments, closing a potential cross-leak path between configured agents sharing the same gateway state. Credential-bearing gateway target URLs are also now redacted in connect-failure logs, so tokens no longer surface in diagnostics.

## Matrix E2EE and Approval Fixes

Two Matrix fixes land in beta.3. MSC4222 `state_after` requests are now suppressed ([#82515](https://github.com/openclaw/openclaw/issues/82515)), preventing encrypted rooms from losing their outbound encryptor on homeservers with incomplete state-after data. Separately, in-flight reaction bindings are released when the approval handler stops mid-delivery ([#82482](https://github.com/openclaw/openclaw/pull/82482)), fixing stale approval targets after restart.

## Other Highlights

- **Android:** Bare and Markdown URLs in chat messages are now tappable ([#82392](https://github.com/openclaw/openclaw/pull/82392))
- **TUI:** The displayed model updates in real time when auto-fallback swaps in a different model mid-turn ([#82296](https://github.com/openclaw/openclaw/pull/82296))
- **Slack:** User mentions now use stable token references so they link and notify correctly ([#82152](https://github.com/openclaw/openclaw/pull/82152)); DM thread replies stay on the main DM session instead of routing to invisible thread-scoped sessions ([#82418](https://github.com/openclaw/openclaw/pull/82418))
- **Gateway/WebChat:** Image attachments now route through a configured vision-capable image model plan before inlining ([#82524](https://github.com/openclaw/openclaw/pull/82524))
- **Gateway restart:** Restart and shutdown signals received during the startup loop are now queued rather than dropped ([#82660](https://github.com/openclaw/openclaw/pull/82660))
- **Auth:** Provider login writes are now serialized through the auth-profile lock across OpenAI Codex, Anthropic, Cloudflare AI Gateway, GitHub Copilot, and z.ai, preventing a live Gateway from overwriting freshly refreshed OAuth credentials with an expired in-memory snapshot

The full changelogs for [beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.2) and [beta.3](https://github.com/openclaw/openclaw/releases/tag/v2026.5.16-beta.3) are on GitHub with the complete contributor list.
