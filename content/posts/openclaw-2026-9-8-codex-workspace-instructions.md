---
title: "OpenClaw Restores Codex Workspace Instructions"
excerpt: "OpenClaw now restores parent workspace persona, skills, and memory guidance for catalog-backed Codex models without leaking that context to child histories."
coverImage: '/assets/images/posts/openclaw-2026-9-8-codex-workspace-instructions.png'
date: '2026-09-08T23:01:00.000Z'
dateFormatted: September 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-8-codex-workspace-instructions.png'
---

OpenClaw merged a Codex integration fix that restores workspace-specific instructions for catalog-backed model requests while keeping those instructions out of native child histories.

[PR #142276](https://github.com/openclaw/openclaw/pull/142276), "fix(codex): restore workspace instructions for catalog-backed models," merged on September 8, 2026 at 22:54 UTC. The PR describes the affected context as workspace persona, identity, user preferences, loaded skills, and memory guidance.

## What Broke

The problem showed up in Codex-backed conversations when the model catalog supplied its own collaboration instructions. In that path, users could lose the workspace context that makes a parent OpenClaw session feel like the right agent: local persona files, user preferences, selected skills, and memory rules.

One tempting repair was to move those files into inherited thread instructions. The PR explicitly avoids that broad inheritance path because it would also add parent-local context to native child histories.

That distinction is important. Parent sessions often carry personal or workspace-specific guidance that should shape the immediate answer, but a lean native child, compaction job, memory task, prewarm request, or approval reviewer should not automatically receive that same local context.

## How OpenClaw Handles It

For supported OpenClaw-managed bundled stdio inference, the fix adds current parent context to the model request's top-level instructions through a private relay. Native base and catalog instructions remain intact, and input history is not rewritten.

The PR says child requests, compaction, memory work, prewarm, and approval reviewers do not receive the parent-local addition. It also checks each admitted per-thread generation against the live host owner before forwarding, so metadata alone does not grant authority.

The relay handles HTTP with Zstd and WebSocket frames, preserves native auth responses and backend paths, and honors Gateway proxy and TLS configuration. The authors describe it as a workaround that should retire once native Codex has a versioned parent-only instruction carrier with refresh, removal, compaction, and child-history isolation semantics.

## User Impact

The visible result is straightforward: supported parent Codex conversations can regain current `SOUL.md`, `IDENTITY.md`, `USER.md`, skills, and memory guidance after catalog-backed model setup.

The less visible result is just as important. Newly supplied parent context is not automatically inherited by native subagents. Existing history and explicit task handoffs are preserved, and the PR does not claim retroactive history scrubbing.

The PR also keeps unsupported modes conservative. External, desktop, custom-command, custom upstream, non-OpenAI provider, unsupported account-mode, locked upstream, and native system-proxy profiles retain legacy behavior with unverified-delivery reporting rather than being silently rerouted.

## Validation

The evidence bundle is unusually detailed. The PR reports 232 original regression cases, a complete `check:changed` pass, multiple authenticated live cases through the actual `agent --local` entrypoint, proxy-owned DNS proof, and refreshed-head CI for `f479595c25f83644018c031b1837c7d751ed95ad`.

The live checks verified that parent persona markers appeared in top-level instructions rather than input history. They also covered Gateway-proxy routing with local DNS unavailable, confirming the proxy owned resolution while end-to-end TLS remained preserved.

For OpenClaw users who rely on Codex as a personal or workspace-aware agent, this closes a subtle but important gap: the parent can stay itself without turning every child or helper request into a copy of the parent.
