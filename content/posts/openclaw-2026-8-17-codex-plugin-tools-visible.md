---
title: "OpenClaw Keeps Codex Plugin Tools Visible"
excerpt: "OpenClaw now carries prepared plugin metadata through Codex, compaction, and /btw paths so restricted-profile tools stay available."
coverImage: '/assets/images/posts/openclaw-2026-8-17-codex-plugin-tools-visible.png'
date: '2026-08-17T08:03:00.000Z'
dateFormatted: August 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-17-codex-plugin-tools-visible.png'
---

OpenClaw merged a high-priority Codex and plugin-runtime repair in [PR #124947](https://github.com/openclaw/openclaw/pull/124947), fixing a bug where prepared plugin metadata could disappear at several agent-runtime boundaries.

The symptom was serious because it could make a plugin tool silently vanish from a restricted built-in profile. In the live reproduction described by the PR, Codex never materialized the tool, produced no model-visible tool result, and then claimed a standing intent had been saved even though the backing `standing_intents` table had no row.

## What Changed

The repair carries one prepared plugin generation through the tool-construction boundaries that previously lost it.

The PR identifies three affected paths:

- normal Codex dynamic-tool construction
- direct compaction
- native `/btw` side questions

After the fix, normal Codex turns receive the prepared runtime snapshot, direct compaction forwards that snapshot into capability-profile resolution and tool construction, and `/btw` side questions carry the same prepared generation through the harness contract and Codex tool bridge.

The patch also introduces a generic `toolMetadata.<tool>.profiles` contract. That lets plugin manifests contribute tools to existing built-in profile policy without hardcoding a plugin ID or tool name into core.

## Fail-Closed Standing Intents

The standing-intent side of the fix is just as important as the tool visibility repair.

Senderless standing-intent creation now refuses to proceed. The PR explains the reason: a prompt-injection hook may have channel, account, and sender facts, but no enforceable authenticated owner principal. Persisting a NULL/NULL scope could turn one owner's reminder text into a match-all reminder eligible for unrelated users.

Instead, OpenClaw now returns an actionable error that names the missing channel and sender identity and asks the operator to retry from an authenticated channel conversation. Authenticated senderless surfaces, such as a local CLI turn, can still list or cancel existing intents, but creation needs both channel and sender identity.

## Why It Matters

Plugin tools are part of OpenClaw's trust and capability surface. If a tool disappears silently, the model may reason as if an action succeeded or choose a weaker path because the declared tool was not actually available.

That is particularly risky for restricted profiles. Those profiles exist to narrow what the agent can do. Tool availability should be explicit, profile-driven, and stable across runtime boundaries, not dependent on whether a turn went through a normal path, a compaction path, or a side-question path.

PR #124947 keeps the authority model intact. Prepared metadata contributes profile membership and runtime factories, but operator allowlists, deny rules, runtime grants, harness authority, and sender-owner checks remain authoritative.

## Evidence From The PR

The regressions failed before the owner-boundary fixes: senderless creation wrote a NULL/NULL row, compaction omitted a manifest-profiled plugin tool, `/btw` omitted the prepared runtime, and the Codex side-thread bridge returned `Unknown OpenClaw tool` for a restricted-profile plugin tool.

Post-fix validation included 35 Memory Core tests, 142 Codex dynamic tools, configured MCP, and side-question tests, 253 agent/profile/plugin tests, 56 `/btw` tests, and sibling path/read coverage. The changed-check fallback ran formatting, guards, typechecks, lint, plugin boundaries, database-first, import-cycle, and architecture checks. A fresh autoreview reported no accepted or actionable findings.

For OpenClaw users and plugin authors, the outcome is cleaner: declared plugin tools stay visible where their profile says they should, and intent creation fails closed when identity is not strong enough.
