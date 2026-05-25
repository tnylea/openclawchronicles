---
title: "OpenClaw beta.2: Voice Steering, 4,100x Speed, and iMessage Approvals"
excerpt: "OpenClaw v2026.5.24-beta.2 ships real-time voice run steering, a 4,100× /models speed boost, iMessage tapback approvals, and a new Meeting Notes plugin."
coverImage: '/assets/images/posts/openclaw-2026-5-25-beta2-release.png'
date: '2026-05-25T08:00:00.000Z'
dateFormatted: May 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-25-beta2-release.png'
---

OpenClaw dropped `v2026.5.24-beta.2` late Sunday night, and the changelog is one of the more packed betas in recent memory. Three headline features stand out above the noise — plus a stack of important fixes and a major privacy tightening for sub-agents.

## Real-Time Voice Run Steering

The biggest UX win in this release: you can now check your agent's run status, cancel it, steer it, or queue follow-up work — all while a consult is still running — from both the WebUI and Discord voice. [PR #84231](https://github.com/openclaw/openclaw/pull/84231) adds realtime wake-name gating and raises the profile bootstrap context budget so longer `USER.md` and `SOUL.md` files stay fully loaded during voice sessions.

Previously you were stuck waiting for a run to finish before redirecting it. Now you can interrupt mid-flight, which matters when an agent goes off on a long autonomous task and you need to course-correct without waiting it out.

## A 4,100× Speedup on /models

This one is almost comically large. [PR #84816](https://github.com/openclaw/openclaw/pull/84816) pre-warms the provider auth-state map at Gateway startup, so the `/models` endpoint and every model-listing call short-circuit per-provider plugin and CLI discovery on the hot path. Per-call cost drops from roughly **20 seconds to ~5 milliseconds** — a 4,100× improvement.

The warm state resets and re-warms after hot reloads, so it won't serve stale data. If `/models` has always felt sluggish in your setup, this should fix it for good.

## iMessage Tapback Approvals

Continuing the pattern from [WhatsApp approval reactions](https://github.com/openclaw/openclaw/pull/85477), iMessage users can now 👍 a pending action to approve it (allow-once) or 👎 to deny it. The approver allowlist is read from `channels.imessage.allowFrom`. The `allow-always` escalation still requires the manual `/approve allow-always` text command — a sensible gate for the more powerful option.

## Meeting Notes Plugin Ships

The new `meeting-notes` plugin arrives as an external source-only plugin with auto-start capture, manual transcript imports, and read-only `openclaw meeting-notes` CLI access. Discord voice is the first live source. Summaries include speaker-labeled transcripts for Discord group voice captures, so you actually know who said what.

## Sub-Agent Context Isolation

[PR #85283](https://github.com/openclaw/openclaw/pull/85283) meaningfully tightens sub-agent privacy. Default bootstrap context for delegated workers is now limited to `AGENTS.md` and `TOOLS.md` only — persona files, `USER.md`, `MEMORY.md`, heartbeat files, and setup files are kept out of sub-agents by default. This prevents accidental leakage of personal context when spawning workers to handle tasks on your behalf.

## Other Notable Additions

- **Image quality preference**: new `agents.defaults.imageQuality` setting for token-efficient, balanced, or high-detail image handling in the image tool
- **xAI/Grok web search**: OAuth auth profiles now carry through to Grok `web_search` calls ([#85182](https://github.com/openclaw/openclaw/pull/85182))
- **Chat session search**: the WebUI session picker gets search and Load More pagination ([#85237](https://github.com/openclaw/openclaw/pull/85237))
- **Classic onboarding**: bare `openclaw` commands before a config exists now trigger the guided setup flow ([#72343](https://github.com/openclaw/openclaw/pull/72343))
- **Embedding providers API**: new generic `embeddingProviders` contract lets plugins register embeddings as a first-class provider surface
- **Security fix**: agent-to-agent wildcard allowlist regexes replaced with a precompiled linear matcher to eliminate backtracking-prone patterns ([#85849](https://github.com/openclaw/openclaw/pull/85849))

## Under the Hood

The release also ships extensive Windows compatibility fixes across scripts, release checks, and plugin staging — plus a significant Gateway perf pass that lazy-loads startup-idle plugin work and caches immutable plugin metadata snapshots so hot paths avoid repeated filesystem walks.

As a pre-release, beta.2 can be tested now with `npm install -g openclaw@beta`. The full changelog is on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.24-beta.2).
