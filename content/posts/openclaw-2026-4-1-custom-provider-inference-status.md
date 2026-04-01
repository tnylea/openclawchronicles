---
title: "OpenClaw Now Infers Custom Providers in /status"
excerpt: "PR #58474 teaches OpenClaw to look up custom model catalog entries when inferring provider identity for the session status card, fixing blank provider fields."
coverImage: '/assets/images/posts/openclaw-2026-4-1-custom-provider-inference-status.png'
date: '2026-04-01T08:05:00.000Z'
dateFormatted: April 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-1-custom-provider-inference-status.png'
---

Running OpenClaw with a custom model provider — OpenRouter, a local Ollama setup, or any configuration that uses `models.providers` to declare a custom catalog? You have probably noticed that the `/status` command shows "unknown provider" next to your model name, even when the provider is clearly configured. [PR #58474](https://github.com/openclaw/openclaw/pull/58474) by [@luoyanglang](https://github.com/luoyanglang), merged April 1st, closes that gap.

## The Problem with Provider Inference

OpenClaw's `/status` command (also exposed as the `session_status` tool) shows a summary of your current session: model in use, provider, context window, auth source, and more. To populate the provider field, it calls `inferUniqueProviderFromConfiguredModels` — a function that works backwards from the active model name to figure out which configured provider owns it.

The issue was that this function only inspected one place: `agents.defaults.models`, the per-agent model list. If your model was listed there, inference worked. If your model lived in `models.providers.*.models` — the provider catalog — inference returned `undefined`, and `/status` showed "unknown provider."

For users who lean on `models.providers` to configure OpenRouter, custom API endpoints, or experimental providers, this made the status card significantly less useful.

## What the Fix Does

The fix extends `inferUniqueProviderFromConfiguredModels` with a second lookup phase that searches the `models.providers` catalog entries. The logic is deliberately conservative:

- If exactly one configured provider claims the active model name, that provider is returned
- If two or more providers could match the same name, the function returns `undefined` — falling back to "unknown provider" rather than guessing wrong

This conservative approach means the worst-case behavior is unchanged from before: an ambiguous or unresolvable model still shows "unknown." But for the common case of a single custom provider, `/status` now displays the correct provider and its configured auth source.

## What You See in /status

Before this fix, a user running `anthropic/claude-sonnet-4-6` via a custom OpenRouter configuration would see something like:

```
Model: anthropic/claude-sonnet-4-6
Provider: unknown
```

After the fix, it correctly surfaces:

```
Model: anthropic/claude-sonnet-4-6
Provider: openrouter (api-key)
```

The auth source field is also populated correctly from the resolved provider, giving you a clear view of exactly how OpenClaw is authenticating with the model endpoint.

## Session Status Tool

This improvement carries over to the `session_status` tool used by agents inside OpenClaw itself. If your agent calls `session_status` to report on its own runtime context, it will now see accurate provider information — useful for agents that adapt their behavior based on which provider is active.

## Implementation Details

The refactor introduces a shared `addProvider` helper inside `inferUniqueProviderFromConfiguredModels` to avoid duplicating the set-management logic between the two lookup phases. The existing `providers.size > 1` early-exit logic is preserved for both phases, ensuring consistent conservative behavior throughout.

The PR ships with thorough test coverage: unit tests for the updated inference function covering the happy-path catalog match and the ambiguous-catalog case, plus integration tests for `resolveSessionModelIdentityRef` and the `session_status` tool itself with a custom-catalog model config. Greptile reviewed it at 5/5 confidence.

## How to Get It

The fix is on `main` and will ship in the next OpenClaw release. Check [github.com/openclaw/openclaw/releases](https://github.com/openclaw/openclaw/releases) for the next tag. Once available, update with:

```bash
npm install -g openclaw@latest
```

No configuration changes are needed — the improved inference happens automatically.
