---
title: "OpenClaw Cron Keeps Scheduled Tool Caps"
excerpt: "OpenClaw fixed senderless cron runs so explicitly capped scheduled jobs keep authorized tools without widening authority."
coverImage: '/assets/images/posts/openclaw-2026-7-24-cron-tool-authority.png'
date: '2026-07-24T08:03:00.000Z'
dateFormatted: July 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-24-cron-tool-authority.png'
---

OpenClaw merged a large cron authority fix in [PR #112661](https://github.com/openclaw/openclaw/pull/112661), addressing a subtle scheduled-job failure mode where senderless cron invocations could lose tools that had already been authorized by the job creator.

The PR closes issue #111809. The bug affected isolated cron jobs with an explicit persisted tool cap. When a later scheduled invocation had no sender identity, OpenClaw could resolve wildcard sender policy again and drop valid creator-authorized tools.

In practice, a scheduled job that was intentionally created with a narrow tool grant could later wake up with no usable tools, even though the original cap remained valid.

## The Authority Model

The fix introduces a trusted internal scheduled-policy context only when two conditions are present:

- the job has a persisted `toolsAllow` cap
- the immutable owner session is available

That context reuses the owner session for current base group policy while skipping only fresh sender-specific overlays. The persisted cap remains the hard upper bound, and non-sender restrictions still apply.

The PR is explicit that global, agent, provider, profile, base-group, sandbox, runtime, subagent, and worker restrictions remain in force. This is not a permission expansion. It is a way to preserve the job creator's original scheduled-job authority when there is no live sender identity.

## Covered Runtimes

The implementation spans more than the core cron loop. The PR says the cap is preserved across embedded, CLI/MCP, continuation, trigger/script, Codex, Copilot, and cloud-worker paths.

It also adds backend-neutral CLI enforcement. Selectable backends must prove exact enforcement through execution arguments or preparation. Claude maps the contract to exact CLI arguments. Gemini stages an isolated system policy that disables native, discovered, agent, hook, skill, and command-backed escape surfaces, then exposes only the grant-scoped OpenClaw MCP server.

That part matters because scheduled jobs often run without a human watching every turn. If a backend cannot prove it can enforce the exact cap, the fixed behavior is to fail before model or tool execution rather than silently discard the cap.

## Upgrade Handling

OpenClaw also handles beta cloud-worker state from the `v2026.7.2-beta.1` through `.3` line. Persisted worker-v1 placements are destroyed and safely redispatched as worker-v2 placements while keeping the session and workspace. Already interrupted starting workers remain visible as retryable failures.

That gives operators a cleaner upgrade path for scheduled jobs already using cloud workers.

## Proof From The PR

The evidence section includes a live repro where a senderless run lost `write` to an anonymous wildcard and failed with no callable tools. The fixed branch then ran a real Gemini CLI scheduled turn where a write-capped job survived a later wildcard filesystem deny and wrote the expected workspace artifact.

The PR also reports OpenClaw and Codex runtime scenario coverage, packaged upgrade proof from `openclaw@2026.7.2-beta.3`, hundreds of focused cron and Gateway tests, full changed-check gates, and a clean autoreview after tightening legacy backend provenance.

For operators, this is a meaningful reliability and security-boundary patch: scheduled jobs keep the tools they were explicitly allowed to use, but they do not gain anything outside their stored cap.
