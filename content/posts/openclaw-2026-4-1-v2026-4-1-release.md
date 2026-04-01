---
title: "OpenClaw v2026.4.1: Voice Wake, SearXNG, Cron Tool Allowlists, and More"
excerpt: "OpenClaw v2026.4.1 ships 14 new features including macOS Voice Wake for Talk Mode, a bundled SearXNG web search provider, and per-job cron tool allowlists."
coverImage: '/assets/images/posts/openclaw-2026-4-1-v2026-4-1-release.png'
date: '2026-04-01T23:00:00.000Z'
dateFormatted: April 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-1-v2026-4-1-release.png'
---

OpenClaw v2026.4.1 landed today (April 1st, 16:58 UTC) with a dense changelog: 14 new features and a long string of fixes across exec approvals, Telegram, tasks, and the gateway. This is a meaningful quality-of-life release for power users who run cron automation, macOS desktops, and Bedrock-backed deployments.

## Headline Features

### /tasks in Chat

The most user-facing addition is [`/tasks`](https://github.com/openclaw/openclaw/issues/54226) — a new chat-native command that surfaces your background task board directly in the current session. You can now check recent task details, agent-local fallback counts, and task status without leaving the conversation. Thanks to [@vincentkoc](https://github.com/vincentkoc) for driving this one home.

### macOS Voice Wake

macOS users get a new **Voice Wake** option ([#58490](https://github.com/openclaw/openclaw/pull/58490)) that triggers Talk Mode hands-free. If you run OpenClaw on a Mac and use voice regularly, this is the upgrade you didn't know you were waiting for. Contributed by [@SmoothExec](https://github.com/SmoothExec).

### Bundled SearXNG Web Search

Privacy-focused users take note: OpenClaw now ships a **SearXNG provider plugin** for `web_search` ([#57317](https://github.com/openclaw/openclaw/pull/57317)). Point it at your own SearXNG instance via the configurable host setting and skip the third-party API entirely. This is huge for fully self-hosted setups. Thanks to [@cgdusek](https://github.com/cgdusek).

### Per-Job Cron Tool Allowlists

Cron automation gets a security upgrade: `openclaw cron --tools` ([#58504](https://github.com/openclaw/openclaw/pull/58504)) now accepts per-job tool allowlists. Instead of giving every scheduled job the full tool surface, you can whittle it down to exactly what that job needs. Contributed by [@andyk-ms](https://github.com/andyk-ms).

### Amazon Bedrock Guardrails

The bundled Bedrock provider now supports [AWS Bedrock Guardrails](https://github.com/openclaw/openclaw/pull/58588) — letting you enforce content policies, topic filters, and PII controls at the infrastructure layer. [@MikeORed](https://github.com/MikeORed) contributed this one.

### Z.AI glm-5.1 and glm-5v-turbo

The Z.AI provider catalog picks up two new models: **glm-5.1** and **glm-5v-turbo** ([#58793](https://github.com/openclaw/openclaw/pull/58793)). Thanks to [@tomsun28](https://github.com/tomsun28).

## Other Notable Additions

- **Agents/default params** — `agents.defaults.params` for global default provider parameters ([#58548](https://github.com/openclaw/openclaw/pull/58548))
- **Agents/failover** — smarter rate-limit retry capping before cross-provider model fallback, with a new `auth.cooldowns.rateLimitedProfileRotations` knob ([#58707](https://github.com/openclaw/openclaw/pull/58707))
- **Feishu/Drive comments** — full comment-thread context resolution and in-thread replies for document collaboration ([#58497](https://github.com/openclaw/openclaw/pull/58497))
- **Gateway/webchat** — `chatHistoryMaxChars` and per-request `maxChars` for configurable history truncation ([#58900](https://github.com/openclaw/openclaw/pull/58900))
- **WhatsApp reactions** — `reactionLevel` guidance in agent system prompts
- **Telegram errors** — configurable `errorPolicy` and `errorCooldownMs` to suppress repeated delivery errors per chat/topic ([#51914](https://github.com/openclaw/openclaw/pull/51914))

## Key Fixes

The fix list is equally meaty:

- **Exec/approvals** — `allow-always` now correctly persists as durable trust rather than acting like `allow-once`. Windows approval fallback no longer hard-dead-ends remote exec.
- **Gateway/reload** — startup config writes no longer trigger restart loops. Auth token generation and seeded Control UI origins are excluded from reload detection.
- **Tasks/gateway** — a critical fix for gateways hanging ~1 minute post-upgrade due to synchronous SQLite pressure in the maintenance sweep ([#58670](https://github.com/openclaw/openclaw/pull/58670))
- **Sessions/model switching** — `/model` changes now queue behind busy runs instead of interrupting the active turn.
- **Telegram/exec approvals** — forum-topic approval followups now stay in the originating topic ([#58783](https://github.com/openclaw/openclaw/issues/58783)).
- **Gateway/HTTP** — one broken HTTP facade no longer forces all endpoints to return 500 ([#58746](https://github.com/openclaw/openclaw/pull/58746))

## Upgrade

Update via your usual method:

```bash
npm install -g openclaw@latest
# or
openclaw update
```

Full changelog on [GitHub Releases](https://github.com/openclaw/openclaw/releases/tag/v2026.4.1).
