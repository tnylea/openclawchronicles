---
title: "OpenClaw Fixes Agent-Scoped Model Status Aliases"
excerpt: "OpenClaw now resolves models status aliases inside the selected agent scope, preventing false provider and auth diagnostics."
coverImage: '/assets/images/posts/openclaw-2026-8-22-agent-model-status-aliases.png'
date: '2026-08-22T08:02:00.000Z'
dateFormatted: August 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-22-agent-model-status-aliases.png'
---

OpenClaw merged a focused diagnostics fix this morning: [PR #127631](https://github.com/openclaw/openclaw/pull/127631) makes `openclaw models status --agent <id>` resolve aliases from the selected agent's model scope instead of global defaults only.

The user-facing bug was easy to misunderstand. An agent could be configured to run one provider/model, while `models status --agent` displayed or probed a different provider route. That made status output, `--check`, auth diagnostics, provider-use reporting, and `--probe` candidates capable of inspecting the wrong model path.

In practical terms, a healthy per-agent alias could look broken because the diagnostic command was not asking the same resolver question as runtime.

## The Missing Agent Scope

OpenClaw already had canonical model selection helpers that accept an `agentId`. Runtime directives, CLI model listing, Gateway listing, and the model picker were already passing it.

This command was the holdout. It resolved the selected agent locally, but then built a synthetic global-default config that carried the agent primary without carrying agent-scoped aliases. That let a bare per-agent alias fall back into global-default resolution.

[PR #127631](https://github.com/openclaw/openclaw/pull/127631) removes that synthetic path. The command now passes the existing `agentId` into the canonical resolver call sites and builds displayed aliases from the effective agent-scoped alias index.

The production change is small and clarifying: the PR reports net negative production lines after deleting the synthetic global-default config.

## What Users Get

For operators with multiple agents, model aliases are often a convenience layer over provider-specific IDs. One agent might define `worker-choice` as an alias for an Anthropic model while global defaults point to an OpenAI model.

After this fix:

- `models status --agent` reports the provider/model that selected agent actually uses;
- `--check`, `--probe`, auth diagnostics, and provider-use reporting inspect the runtime route;
- per-agent alias rows can replace global aliases for the selected agent;
- unscoped `models status` remains on global defaults.

No config schema, protocol, persisted state, or public API surface changes were needed. This is a read-only diagnostic command aligning with the already-shared model selection boundary.

## Why It Matters

Model diagnostics are part of operational confidence. If a command says the wrong provider is missing auth, users can waste time repairing credentials the agent does not actually use.

That becomes especially costly in multi-agent setups where model defaults, fallbacks, and aliases vary by role. The more OpenClaw supports per-agent routing, the more important it is that every diagnostic command shares the same effective configuration model as runtime.

## Validation

The PR added three tests in `src/commands/models/list.status.test.ts`, exercising the real canonical resolvers end to end through `modelsStatusCommand`.

The author reports a red proof with the production fix stashed: two new regression tests failed with the exact wrong resolved values. After restoring the fix, the focused status suite passed with 38 tests. A real CLI proof using an isolated `openclaw.json` also showed `resolvedDefault` matching the selected agent's configured model rather than a global OpenAI route.

Formatting and focused lint checks also passed. Full local build was not run on the constrained host, with CI left as the authority for broader lanes.

## Bottom Line

[PR #127631](https://github.com/openclaw/openclaw/pull/127631) makes model status diagnostics tell the same story as runtime. In a per-agent world, that is exactly where the command needs to be.
