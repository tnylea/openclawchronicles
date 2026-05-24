---
title: "OpenClaw v2026.5.24 Beta: Steer Running Sessions by Voice, Subagent Privacy, and Image Quality Controls"
excerpt: "OpenClaw v2026.5.24-beta.1 ships real-time voice steering during active agent runs, tighter subagent bootstrap privacy, and per-session image quality control."
coverImage: '/assets/images/posts/openclaw-2026-5-24-voice-steering-beta.png'
date: '2026-05-24T23:00:00.000Z'
dateFormatted: May 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-24-voice-steering-beta.png'
---

OpenClaw published **v2026.5.24-beta.1** this afternoon, and it's a meaningful step up from the v2026.5.22 stable that landed this morning. Three features stand out as genuinely new ground: real-time voice control over active sessions, a privacy-first subagent bootstrap limit, and a new image quality preference that lets you trade token cost for detail.

Here's what's in the beta.

## Steer a Running Session by Voice

The biggest feature in this build is in the Talk/realtime channel. Previously, if you were mid-consult on a long-running agent task, you had to wait for it to finish before steering or cancelling. Now, **WebUI and Discord voice callers can ask for active run status, cancel a run, steer it mid-flight, or queue follow-up work — all while the consult is still going**. ([#84231](https://github.com/openclaw/openclaw/pull/84231), thanks [@Solvely-Colin](https://github.com/Solvely-Colin))

This changes the human-on-the-loop dynamic significantly. Instead of "fire and wait," voice users get genuine interrupt capability. You can say "stop, that's the wrong direction" and have the agent actually respond before it's burned another ten tool calls going the wrong way.

Alongside this, Discord voice now supports **realtime wake-name gating** — the agent only activates on its configured name — and the profile bootstrap context budget has been raised to accommodate longer `USER.md` and `SOUL.md` files. Both changes improve the practical experience of running OpenClaw as a persistent voice assistant.

## Subagent Bootstrap Privacy

A long-requested change to subagent behavior lands in this beta: **sub-agents now receive only `AGENTS.md` and `TOOLS.md` by default**. ([#85283](https://github.com/openclaw/openclaw/pull/85283), thanks [@100yenadmin](https://github.com/100yenadmin))

Previously, spawned workers could inherit the full bootstrap context — including `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, and heartbeat files. For personal agent setups, that meant a sub-agent delegated to a third-party skill or cron task could see private user context that's genuinely none of its business.

The new default keeps delegated workers lean and scoped. If a specific sub-agent legitimately needs additional context files, you can configure them explicitly. This is a sensible secure-by-default change.

## Image Quality Controls

There's a new preference for the image tool: **`agents.defaults.imageQuality`**. It accepts three values — `token-efficient`, `balanced`, or `high-detail` — and controls how the image tool handles adaptive model-aware compression when processing images.

The use case is straightforward: users running OpenClaw on lightweight models or with tight context budgets can set `token-efficient` to reduce the token cost of image inputs. Users doing detailed visual analysis can bump it to `high-detail`. The default `balanced` behavior is unchanged from before, so existing setups aren't affected.

## Named Auth Profiles for CLI Login

The `openclaw models auth login` command now supports a `--profile-id` flag. This lets you store a returned provider auth profile under a named identifier, making it easier to manage multiple accounts or switch between provider configs from the CLI. ([#49315](https://github.com/openclaw/openclaw/pull/49315), thanks [@DanielLSM](https://github.com/DanielLSM))

## Observability Additions

Two new diagnostics entries round out the build:

- **Sanitized secrets.prepare spans** are now emitted in the Gateway timeline. Operators can now distinguish secret startup latency in traces without exposing provider names, secret IDs, or values. ([#83019](https://github.com/openclaw/openclaw/pull/83019), thanks [@samzong](https://github.com/samzong))
- **Bounded skill usage metrics and spans** are exported for core, plugin, MCP, and channel tool executions, with tool source and owner labels included — without exposing raw paths or session identifiers. ([#80370](https://github.com/openclaw/openclaw/pull/80370), thanks [@gauravprasadgp](https://github.com/gauravprasadgp))

Both of these matter most for team and self-hosted deployments using OpenTelemetry or Prometheus. The QA-Lab OpenTelemetry smoke harness has been extended in this build to prove trace, metric, and log export end-to-end.

## Also in This Build

- **xAI/Grok**: xAI OAuth auth profiles now work for `web_search`, Grok model aliases are available, and media providers can now declare default operation timeouts. ([#85182](https://github.com/openclaw/openclaw/pull/85182))
- **Control UI**: The chat session picker now has search and Load More pagination — useful for anyone with a long session history. ([#85237](https://github.com/openclaw/openclaw/pull/85237))
- **Embedding providers API**: A general `embeddingProviders` capability contract and registration API lands in the Plugin SDK, opening embeddings as a reusable provider surface outside memory-specific adapters.
- **Classic onboarding on first run**: Running bare `openclaw` before any config exists now starts the classic onboarding flow rather than erroring. ([#72343](https://github.com/openclaw/openclaw/pull/72343))

## How to Install

This is a pre-release build. To try it:

```bash
npm install -g openclaw@beta
```

Or pin the specific version:

```bash
npm install -g openclaw@2026.5.24-beta.1
```

The stable channel will follow once the beta soak completes. If you hit issues, the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.24-beta.1) has the full changelog and issue tracker links.
