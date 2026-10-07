---
title: "OpenClaw Adds Claude Haiku 5.5 Support"
excerpt: "OpenClaw now supports Claude Haiku 5.5 across Anthropic API and Claude CLI routes, with updated context, output, thinking, and pricing metadata."
coverImage: '/assets/images/posts/openclaw-2026-10-7-claude-haiku-55-support.png'
date: '2026-10-07T23:30:00.000Z'
dateFormatted: October 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-7-claude-haiku-55-support.png'
---

OpenClaw added support for Claude Haiku 5.5 tonight, bringing Anthropic's newer lightweight model into the platform's catalog and runtime contracts.

[PR #166706](https://github.com/openclaw/openclaw/pull/166706), "feat(anthropic): support Claude Haiku 5.5," updates OpenClaw so users can select Haiku 5.5 through Anthropic API routes and Claude CLI routes. The `haiku` alias and default utility model now advance to 5.5, while explicit Haiku 4.5 selections remain available.

## What Users Get

The PR encodes the published Haiku 5.5 contract in OpenClaw's provider catalog and shared Claude runtime logic.

That includes:

- 1M context support
- 128K output support
- Adaptive thinking behavior
- Tiered API pricing metadata
- Claude CLI and direct Anthropic API selection
- Continued support for explicit Haiku 4.5 references

This is a model-support update, not a Gateway migration. The PR does not add a new config format, mutate existing Gateway configuration, or publish a release by itself.

## Why Model Catalog Updates Matter

Adding a model to OpenClaw is more than placing a new string in a dropdown. The platform has to understand what the model can do across direct API calls, managed routes, CLI-backed execution, catalog aliases, pricing displays, tool behavior, thinking controls, replay policy, and compatibility checks.

That is especially important for Claude models because thinking and transcript replay are part of the runtime contract. The PR sets default effort to medium, allows thinking to be disabled, preserves forced tool support, and omits unsupported sampling and priority options.

It also fixes pricing equality logic so a discovered flat-rate row cannot hide the published long-prompt tier. That matters for users trying to estimate real operating costs before routing work to a new model.

## Signed Thinking Replay

One follow-up repair in the PR is worth calling out. Review found that older signed Haiku 5.5 thinking could be stripped at the agent replay-policy boundary, even though transport-only replay preserved it.

The fix reuses OpenClaw's existing Claude thinking-prefix binding decision so prefix-bound Claude models retain signed thinking where appropriate. Legacy models, invalid signatures, and stale compaction signatures keep their previous behavior.

That is a small source change with a large correctness surface. If OpenClaw accepts a model's signed thinking prefix contract at transport time, the agent transcript sanitizer needs to preserve the same contract during later turns.

## Proof And Validation

The PR includes direct and managed transport tests, provider catalog checks, CLI migration coverage, pricing regressions, forward-compatibility tests, and sanitizer replay tests.

There is also live proof. Claude CLI accepted `claude-haiku-5-5` with medium effort in an isolated one-shot run. Later authenticated proof through the Anthropic models API confirmed the model was reachable, and direct plus managed transports completed multi-turn signed-thinking scenarios with the preserved prefix reaching the API boundary.

The final head reached green CI and an exact-head review with no remaining actionable findings.

## Bottom Line

Haiku 5.5 is now a first-class OpenClaw model option. Users get the newer Claude utility path without losing explicit Haiku 4.5 compatibility, and the runtime now knows enough about context, output, pricing, thinking, and replay to route it intentionally.
