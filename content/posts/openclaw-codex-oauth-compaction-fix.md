---
title: "OpenClaw Fixes Codex OAuth Compaction"
excerpt: "OpenClaw merged a P1 Codex OAuth compaction fix so OpenAI sessions can compact without requiring a separate OpenAI API key."
coverImage: '/assets/images/posts/openclaw-codex-oauth-compaction-fix.png'
date: '2026-06-24T08:01:00.000Z'
dateFormatted: June 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-codex-oauth-compaction-fix.png'
---

OpenClaw merged a P1 runtime fix after the stable `v2026.6.10` release: [PR #95831, "fix: compact Codex OAuth OpenAI sessions without API keys"](https://github.com/openclaw/openclaw/pull/95831).

The bug hit a narrow but important workflow. Users running canonical OpenAI models through the Codex OAuth runtime could run normal agent turns successfully, but manual `/compact` or budget-triggered compaction could fail with a missing OpenAI API key error. In other words, the session was authenticated well enough to work until it needed to shrink context.

That is a painful failure mode for long-running agents. Compaction is supposed to keep work moving when context grows. If compaction suddenly asks for an API key that the active runtime does not need, the failure arrives exactly when the user is trying to preserve continuity.

## What Changed

The PR changes how OpenClaw decides which compaction backend should handle an active OpenAI model session.

Before the fix, queued compaction could fall through to the direct OpenClaw OpenAI path and expect an API-key-backed profile. That was wrong for sessions using the Codex native harness through OAuth. The PR body says the compaction target resolver now carries an internal `nativeHarnessCompaction` fact when the active OpenAI model should compact through the Codex native harness.

That fact is then used instead of treating `contextProvider` as the behavior sentinel. The distinction matters:

- Canonical OpenAI plus Codex runtime sessions can compact through Codex
- OAuth-only profiles do not need a separate `OPENAI_API_KEY`
- Custom OpenAI-compatible base URL providers keep using the direct OpenClaw compaction path
- No new CLI flag, config surface, SDK API, or persisted state is added

That last point is important. The fix is internal routing logic, not a new configuration burden for users.

## Why This Matters

OpenClaw's Codex runtime is becoming a first-class way to run OpenAI-backed sessions without asking every user to manage a separate API key profile. If normal turns use that runtime but compaction does not, the product feels inconsistent and the agent can stall during exactly the kind of long task where continuity matters most.

The PR is labeled P1 and carries `merge-risk: auth-provider` plus `merge-risk: session-state`, which is a fair signal of the blast radius. It touches the intersection of authentication, provider routing, and session lifecycle. Those are the places where small mismatches can create large user-facing surprises.

## The Proof Path

The PR includes a useful real-behavior proof. The author tested in a local Podman Crabbox environment with real local Codex OAuth credentials forwarded as a secret env profile and no direct OpenAI API-key credential for the migrated OpenAI profile.

The proof flow imported Codex OAuth, verified that the OpenAI config and persisted auth profiles were OAuth-only, ran a live `openai/gpt-5.5` Codex-harness agent turn, then called `sessions.compact` for that session.

The observed result after the fix was that `sessions.compact` returned `ok:true`, with details pointing at the Codex app-server backend and a pending compact signal. The PR also reports focused Vitest coverage, a clean diff check, and autoreview with no accepted actionable findings.

## Bottom Line

This is not a new feature users need to learn. It is a consistency fix: if a Codex OAuth OpenAI session can run, it should also be able to compact through the same native path.

For anyone running long-lived Codex-backed OpenClaw sessions, [PR #95831](https://github.com/openclaw/openclaw/pull/95831) is worth tracking for the next release.
