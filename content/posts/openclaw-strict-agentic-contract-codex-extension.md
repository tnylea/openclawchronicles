---
title: "OpenClaw Agents Get a Strict Execution Contract and Codex Extension"
excerpt: "Two major PRs merged April 10th: a strict-agentic execution contract that formalizes update_plan semantics, and a full refactor of the agent harness into a first-class Codex extension."
coverImage: '/assets/images/posts/openclaw-strict-agentic-contract-codex-extension.png'
date: '2026-04-10T23:00:00.000Z'
dateFormatted: April 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-strict-agentic-contract-codex-extension.png'
---

Two of the most-commented pull requests in OpenClaw's recent history landed on April 10th, 2026, and together they represent a significant shift in how the agent runtime is structured and how agentic behavior is governed. Here is a deep dive into both.

## PR #64241 — Strict-Agentic Execution Contract

**[agents: add strict-agentic execution contract and revise update_plan semantics](https://github.com/openclaw/openclaw/pull/64241)** — 43 comments, size: L

This PR introduces what the team is calling the "strict-agentic execution contract" — a formalized set of invariants that govern how agents sequence tool calls, emit plan updates, and commit to final answers.

### What the contract covers

Previously, `update_plan` was treated as a suggestive annotation that agents could emit whenever they felt like providing progress feedback. Interpretation varied across providers, and the core runtime had no strong opinion about ordering or completeness.

Under the new contract:

- `update_plan` calls are now **semantically sequenced** — the runtime enforces that plan step states transition in a defined order (pending → active → done/failed), and out-of-order transitions are rejected with structured errors.
- Agents must emit a **structured execution item event** for each discrete step before performing tool calls that fulfil it. This gives UIs — including the Control UI — a reliable signal to show step-by-step progress during long runs.
- The contract distinguishes between **planning phases** (where the agent may emit multiple `update_plan` calls without side effects) and **execution phases** (where each `update_plan` must correspond to real tool calls or final answer delivery).
- A new `tools.experimental.planTool=false` opt-out is available for deployments that want the old permissive behavior.

### Why it matters

The strict contract is the foundation for several downstream improvements the team has been working toward: deterministic progress UI, reliable token accounting per step, and sub-agent orchestration that can safely retry individual plan steps without re-running the whole conversation.

If you are building on the OpenClaw Plugin SDK and emitting `update_plan` calls from custom agents, review the updated semantics — the [PR description](https://github.com/openclaw/openclaw/pull/64241) includes a migration guide.

## PR #64298 — Agent Harness Refactored into Codex Extension

**[Refactor agent harness into Codex extension](https://github.com/openclaw/openclaw/pull/64298)** — 49 comments, size: XL, by [@steipete](https://github.com/steipete)

This is a significant structural change: the OpenClaw agent harness — the runtime wrapper that handles session management, tool dispatch, and reply routing — has been extracted from core and reimplemented as a bundled Codex extension.

### What changed

Previously, agent harness logic lived in `core` alongside gateway routing code, making it difficult to test in isolation and hard for plugin authors to hook into harness lifecycle events. The Codex extension model gives the harness a clean boundary.

Practically, this means:

- **Harness logic is now replaceable**: operators can swap or extend the bundled harness by registering an alternative Codex extension, without touching core or forking the repo.
- **Plugin SDK hooks are richer**: the `before_tool_call` and `after_tool_call` hooks now receive harness-scoped context, including the current plan state and execution contract phase.
- **Test isolation improves**: the harness can be unit-tested without spinning up a full gateway instance, which benefits contributors writing integration tests for agent behavior.
- The `contextEngine` slot is preserved through config normalization ([#64192](https://github.com/openclaw/openclaw/pull/64192)) as a companion fix, ensuring existing context engine configurations survive the refactor.

### Compatibility notes

For most users, this change is transparent. If you have custom plugins that hook into agent harness internals via private import paths, those paths are now behind the Codex extension API and you will need to update to the public hooks. The PR description includes a compatibility table.

[@steipete](https://github.com/steipete) is a long-time OpenClaw contributor and maintainer of the popular OpenClaw MCP bridge, so this refactor reflects real-world production experience with harness extensibility.

## Subagent Thread Routing Fix

A quieter but practically important fix also landed: **[#63143](https://github.com/openclaw/openclaw/pull/63143) — keep subagent announces in the original thread**. Previously, when a subagent running inside a thread session posted an announce-mode reply, it could be routed to a top-level channel context rather than the originating thread. This caused missed replies in Discord and Slack deployments that use thread-bound sessions heavily. Now thread context is preserved across subagent announce routing.

## What to Watch

Both the strict-agentic contract and the Codex extension refactor are pre-release and will ship in the next tagged release. Watch the [GitHub releases page](https://github.com/openclaw/openclaw/releases) and the `#announcements` channel in the [OpenClaw Discord](https://discord.com/invite/clawd) for the formal announcement.
