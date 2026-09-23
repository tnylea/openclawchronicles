---
title: "OpenClaw Extends Ultra Mode Across Agent Runtimes"
excerpt: "OpenClaw now applies Ultra as a turn-scoped harness mode across supported runtimes while respecting each configured model capability profile."
coverImage: '/assets/images/posts/openclaw-2026-9-23-ultra-mode-agent-runtimes.png'
date: '2026-09-23T08:02:00.000Z'
dateFormatted: September 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-23-ultra-mode-agent-runtimes.png'
---

OpenClaw merged a cross-runtime feature update this morning that makes Ultra more consistent across agent execution paths. [PR #155393](https://github.com/openclaw/openclaw/pull/155393), "feat: extend Ultra harness mode across supported runtimes," closes an issue where Ultra was coupled too tightly to a model's maximum provider reasoning effort.

The change affects OpenClaw, Claude Code, Native Codex, CLI execution, and cloud-worker preparation. The aim is not to force every provider into the same reasoning API. Instead, Ultra becomes a turn-scoped harness mode while provider-facing effort is lowered through the effective configured model's capability profile.

That distinction matters because model routes can vary widely. Some support native effort controls. Some are nonreasoning models. Some have no effort field at all. The new behavior keeps those differences intact.

## What Ultra Means Now

According to the PR, OpenClaw and Claude Code can now use Ultra as a turn-scoped harness mode. When a provider exposes effort controls, OpenClaw lowers the provider-facing value according to the configured model's capability profile. Nonreasoning models remain nonreasoning, and models without effort controls omit the field.

Native Codex keeps its own Ultra behavior where native effort controls support it. Existing defaults, explicit effort settings, cached Responses configuration updates, and tool permissions remain intact.

The PR also repairs capability ownership for configured routes. CLI and cloud-worker preparation now share the configured catalog capability owner in omitted, merge, and replace modes. If the configured transport changes, stale route-bound capabilities are cleared without changing catalog naming rules.

## Why This Is Useful

Ultra is a user-facing mode, but the implementation has to cross several execution boundaries. A local CLI run, a cloud worker, an embedded runner, and Native Codex should not accidentally inherit stale capability assumptions from a different configured route.

This update tightens that handoff. The Gateway worker lifecycle, cancellation checks, run and phase ownership, and post-prepare context fence are retained. Ultra guidance also does not grant delegation tools that are unavailable.

For people running OpenClaw across several providers and surfaces, the practical promise is consistency: selecting Ultra should shape the turn without smuggling invalid provider fields into routes that do not support them.

## Verification

The change landed with substantial focused proof. The PR reports retained owner/profile coverage, embedded runner checks, CLI execution proof, isolated completion coverage, cloud launch tests, Native Codex validation, session and directive tests, compaction proof, and serialized session-row verification.

The final catalog and configured-selection proof passed 60 tests. The integrated conflict delta passed the complete worker lifecycle and Ultra suite, plus focused chat startup and history regressions. Formatting, line-cap, core and Gateway type graphs, and scoped lint passed with zero warnings or errors.

Exact-head hosted CI passed for the signed candidate, and the completed ClawSweeper review covered the same head with no findings. The PR is also clear about its limits: this is deterministic boundary testing, not authenticated provider inference, and it introduces no new provider API field, configuration option, or dependency.

Ultra now has a cleaner runtime contract. That should make future model-route work easier to reason about, and make today's multi-runtime OpenClaw sessions a little less surprising.
