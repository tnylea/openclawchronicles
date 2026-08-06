---
title: "OpenClaw Honors ACP Configured Models"
excerpt: "OpenClaw PR #120046 makes configured ACP agent models authoritative instead of letting gateway environment defaults override them."
coverImage: '/assets/images/posts/openclaw-2026-8-6-acp-configured-models.png'
date: '2026-08-06T23:02:00.000Z'
dateFormatted: August 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-6-acp-configured-models.png'
---

OpenClaw merged [PR #120046, "fix(acp): pass configured agent model to ACP binding sessions"](https://github.com/openclaw/openclaw/pull/120046), a focused ACP fix for anyone who expects the model in `openclaw.json` to be the model an agent actually uses.

The issue was easy to miss. An ACP agent could define an explicit model in `model.primary`, but the configured-binding producer did not pass that model into the ACP session. When the child process started, it inherited the Gateway's `ANTHROPIC_MODEL` environment variable. The ACP adapter treated that environment value as higher priority, so the agent could silently run with a different model than the owner configured.

For a self-hosted agent platform, silent model drift is more than a preference bug. Model choice affects cost, latency, tool behavior, review quality, and in some deployments, compliance expectations.

## The Binding Owns The Decision

The fix moves the model decision to the configured binding owner. OpenClaw now resolves the agent's explicit primary model once through `resolveAgentExplicitModelPrimary`, stores it with the binding record, and passes it as `runtimeOptions.model` when initializing the ACP session.

That preserves the existing runtime model flow without adding a new protocol surface. The PR says restart, resume, failover, oneshot, and backend-neutral paths already replay persisted runtime options correctly, so the repair focuses on the missing producer-side fact.

Existing bound sessions are handled carefully. If a bound session has drifted away from the configured owner model, OpenClaw patches its runtime options in place. Conversation state is preserved, and manual ACP model choices remain untouched when no explicit owner model is configured.

## What Operators Get

The user-facing behavior is straightforward: configured ACP agent models become authoritative.

That means:

- A model pinned in `openclaw.json` should survive Gateway environment defaults.
- Existing ACP conversations do not need to be discarded just to correct runtime options.
- Manual choices remain valid where there is no explicit owner model to enforce.

This is especially important on systems where the Gateway runs with a broad environment used by multiple agents. Environment variables are convenient defaults, but they should not override a specific agent owner's configuration once that configuration exists.

## Why It Matters

ACP is one of the places where OpenClaw connects long-lived agent state to external runtimes. If the binding does not carry the owner's explicit facts, operators can end up debugging behavior that belongs to the wrong model entirely.

PR #120046 keeps the decision close to the configuration source. The PR includes tests for persistent binding lifecycle, bindings, manager session initialization, and runtime-config validation, plus an independent autoreview noted by the authors.

For teams running multiple ACP agents with different model profiles, this is the boring, necessary fix: the configured model should be the model that shows up in the session.
