---
title: "OpenClaw Makes Unknown Tool Errors Recoverable"
excerpt: "OpenClaw now gives agents caller-specific recovery guidance when they guess unavailable tool IDs, reducing dead-end automation failures."
coverImage: '/assets/images/posts/openclaw-2026-6-23-tool-search-recovery.png'
date: '2026-06-23T08:00:00.000Z'
dateFormatted: June 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-23-tool-search-recovery.png'
---

OpenClaw merged [PR #93374](https://github.com/openclaw/openclaw/pull/93374), a P1 agent-runtime fix that makes unknown tool ID failures recoverable across Tool Search, Tool Search Code Mode, and generic Code Mode.

The bug was subtle but painful. When a model guessed a tool ID such as `file_write`, OpenClaw could return a dead-end lookup error instead of telling the caller how to search the active catalog, inspect the available tool, and retry with the exact ID. In long-running sessions, that kind of dead end can cost more than one failed action. It can derail the active turn before the model has a clean path back to the tool surface.

## The Recovery Contract

The fix keeps recovery guidance tied to the caller surface that actually received the failure. That distinction matters because OpenClaw exposes similar tool-search semantics through different APIs:

- Raw Tool Search now points models toward `tool_search`, `tool_describe`, and `tool_call`.
- The Tool Search Code Mode bridge points code toward `openclaw.tools.search`, `openclaw.tools.describe`, and `openclaw.tools.call`.
- Generic Code Mode points code toward `tools.search`, `tools.describe`, and `tools.call`.

The PR also fixes the no-suggestion path. Previously, recovery guidance could disappear when OpenClaw had no close match to suggest. Now the shared formatter keeps the retry instructions even when the guessed ID has no obvious neighbor.

## Why This Matters

Tool catalogs are dynamic. OpenClaw agents can see different tools depending on installed plugins, channel context, MCP availability, policy boundaries, and active runtime mode. A model guessing a familiar name is not surprising. The important question is whether the runtime turns that miss into a useful next step.

This patch does not make guessed IDs executable. It does not add aliases, broaden matching, change public config, or alter wire protocols. That restraint is important. Executing guessed names would weaken the tool boundary. The safer fix is to keep the error explicit and teach the model how to recover through the existing catalog APIs.

## Proof Across Surfaces

The PR includes gateway proof for raw `/v1/responses`, the Code Mode bridge, and generic Code Mode. The proof exercised a catalog containing an available `write` tool while the caller guessed `file_write`, then verified that OpenClaw returned the correct recovery wording for each caller surface without executing the available tool.

Regression tests now cover both close-match and no-suggestion behavior. The author reports focused Vitest runs for Tool Search and Code Mode, plus current-head local gateway proof.

For operators, the user-facing effect should be simple: when an agent guesses the wrong tool ID, OpenClaw should now help it search, inspect, and retry instead of leaving the run stuck on a bare lookup failure.
