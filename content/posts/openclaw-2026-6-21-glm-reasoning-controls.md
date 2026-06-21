---
title: "OpenClaw Expands GLM Reasoning Controls"
excerpt: "OpenClaw now exposes richer GLM reasoning levels across native think menus and Z.AI GLM-5.2 payloads, improving provider control."
coverImage: '/assets/images/posts/openclaw-2026-6-21-glm-reasoning-controls.png'
date: '2026-06-21T08:01:00.000Z'
dateFormatted: June 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-21-glm-reasoning-controls.png'
---

OpenClaw's reasoning controls got a focused provider and channel polish pass this morning through two merged PRs: [PR #94067](https://github.com/openclaw/openclaw/pull/94067) for native `/think` menus and [PR #94136](https://github.com/openclaw/openclaw/pull/94136) for Z.AI GLM-5.2 thinking levels.

Together, the changes make OpenClaw's model controls line up better with what modern GLM providers can actually do. That sounds narrow, but it affects one of the most visible parts of daily agent use: choosing how much reasoning a model should spend on a task.

## Live Models In Native Menus

PR #94067 fixes a menu mismatch for live-discovered reasoning models. The reported case used an Ollama-discovered `glm-5.2:cloud` model whose runtime metadata said it supported thinking. OpenClaw already accepted `/think medium`, and the current-level display was correct, but a bare `/think` menu only listed `default` and `off`.

The root cause was catalog choice. The setter and current-level display were already using the runtime catalog, but the native menu/autocomplete path fell back to the configured catalog. When a wildcard-allowlisted model was discovered at runtime and did not exist in config, the menu did not see its reasoning capability.

The fix passes the runtime catalog into the `think` command menu for Telegram, Slack, and Discord. It is intentionally scoped: `/model` and other command menus keep their existing behavior, and empty or failed discovery still falls back to the configured catalog.

The expected visible result is straightforward. For a live-discovered reasoning model, native `/think` surfaces can now list richer levels such as `low`, `medium`, `high`, and `max` instead of making the user guess which hidden values work.

## Z.AI GLM-5.2 Gets Native Levels

PR #94136 handles the bundled Z.AI provider side. Before the merge, OpenClaw exposed Z.AI thinking as a binary `off/on` control even though `glm-5.2` supports more granular reasoning effort.

The new behavior advertises `off`, `low`, `high`, and `max` for `zai/glm-5.2`. Payload wrapping maps `low` and `high` to Z.AI's `reasoning_effort: "high"`, maps `max` to `reasoning_effort: "max"`, and disables thinking for `off` and `minimal`.

Older Z.AI GLM models keep the binary controls, so this is not a broad provider-policy rewrite. It is a model-specific correction for GLM-5.2.

## Why Operators Should Care

Reasoning controls are a cost, latency, and quality knob. A simple drafting task may not need maximum reasoning; a complicated debugging or planning turn might. If the UI hides available levels, users either underuse the model or rely on undocumented command values.

These PRs make the controls more honest in two places:

- Native channel menus now reflect live runtime discovery for `/think`.
- Z.AI GLM-5.2 now gets provider-specific reasoning payloads instead of a generic binary switch.

Both PRs include targeted verification. The native-menu fix reports passing Telegram, Discord, and Slack command suites, plus resolver-chain tests for live-discovered reasoning metadata. The Z.AI fix includes focused provider tests and live redacted `openclaw infer model run` proofs for `off`, `high`, and `max`.

The result is a cleaner model-control surface for GLM users, especially those running OpenClaw from Telegram, Slack, Discord, or provider setups where models are discovered at runtime rather than written into config by hand.
