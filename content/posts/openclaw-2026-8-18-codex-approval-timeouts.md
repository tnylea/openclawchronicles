---
title: "OpenClaw Keeps Codex Turns Alive After Timeouts"
excerpt: "OpenClaw now treats expired Codex command approvals as declined commands instead of aborting the entire agent turn."
coverImage: '/assets/images/posts/openclaw-2026-8-18-codex-approval-timeouts.png'
date: '2026-08-18T08:02:00.000Z'
dateFormatted: August 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-18-codex-approval-timeouts.png'
---

OpenClaw merged a high-priority Codex reliability fix in [PR #125671](https://github.com/openclaw/openclaw/pull/125671), changing what happens when a command approval expires before an operator answers.

Before the fix, an expired approval could terminate the entire Codex turn. The durable approval record retained a denial and a timeout reason, but the runtime discarded that distinction, projected the result as a Codex cancel, and could leave chat without a final assistant response.

That is a bad failure mode for unattended or delayed workflows. A command that did not receive approval should fail clearly, but it should not necessarily kill the entire agent turn.

## What Changed

The host capability now preserves the structured approval decision and the terminal reason. The Codex bridge maps operator denial, timeout, and unavailable approval routes to `decline`, while reserving `cancel` for an actually aborted run.

That distinction follows Codex's upstream contract: decline rejects the command and lets the turn continue, while cancel aborts the turn. The PR removes the old decline-to-cancel fallback and the null-decision timeout inference that helped create the confusing behavior.

Timeouts also keep a bounded, static explanation through several downstream surfaces:

- lifecycle diagnostics
- trajectory records
- post-tool hooks
- durable native tool results
- settled-turn finalization
- visible failure fallback output

The point is not just to continue the turn. It is to leave visible evidence that the command failed because approval timed out.

## Why It Matters

Approval handling is one of the most important boundaries in an agent system. Users need to know that declined, timed-out, unavailable, and aborted operations mean different things.

With this fix, an operator who misses a prompt does not accidentally convert a single command failure into a full run cancellation. The agent can explain the timeout, choose another path when appropriate, or finish with a useful final response.

This is especially relevant for Codex-backed OpenClaw workflows that request command approval from chat, native apps, or other mediated surfaces. A timeout is ordinary operational reality; treating it as a fatal cancellation made the system more brittle than it needed to be.

## Evidence From The PR

The PR reports regression coverage that uses realistic Codex approval decisions and verifies that timeout returns `decline`, not `cancel`. Harness tests verify that `{ decision: "deny", terminalReason: "timeout" }` survives the host boundary, while projector tests verify that timeout evidence reaches durable tool results and related run surfaces without marking the turn aborted.

The live proof is stronger than a unit-only claim. The author used a real OpenAI API key and real Codex app-server in temporary isolated state, created an approval list with `accept` and `cancel` but no `decline`, waited the real 120-second approval deadline, verified the command did not execute, retained exact `approval_timeout` tool evidence, kept the turn non-aborted, and received a non-empty final assistant response.

The validation list also includes focused Vitest suites, `node scripts/check-changed.mjs`, `pnpm plugin-sdk:surface:check`, `pnpm build`, direct sibling Codex source inspection, and a clean final Codex autoreview.

## Upgrade Context

The PR says the relevant V2 host capability first appears only in `v2026.8.1-beta.2`; no stable release contains it. That means the fix updates the internal beta shape directly rather than carrying a compatibility alias for older stable builds.

For users, the headline is straightforward: an expired Codex command approval should now decline the command and preserve the conversation, instead of making the whole turn disappear.
