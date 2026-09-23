---
title: "OpenClaw Restores Local Codex Agent Turns"
excerpt: "OpenClaw fixes local Codex agent turns that failed before execution when no Gateway owned the plugin registry."
coverImage: '/assets/images/posts/openclaw-2026-9-23-local-codex-agent-turns.png'
date: '2026-09-23T23:01:00.000Z'
dateFormatted: September 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-23-local-codex-agent-turns.png'
---

OpenClaw's local Codex path picked up an important P1 fix today. [PR #156624](https://github.com/openclaw/openclaw/pull/156624) repairs `openclaw agent --local` turns that could fail before execution with a `DetachedTaskRuntimeOwnerRetiredError` when no Gateway owned the plugin registry.

This is one of those changes that reads like infrastructure plumbing until it is your local agent run that never starts. The user impact is direct: local Codex agent turns can now admit the native task runtime through the local command's scoped registry, without requiring a configuration, schema, protocol, or timeout change.

## The Failure Mode

Local OpenClaw commands intentionally use scoped plugin handles. They are not the same thing as a full Gateway activation, and they should not have to publish one just to run a local agent turn.

The bug came from detached task admission expecting an activation epoch. That check was valid for the ordinary Gateway-owned path, but too broad for a local command that legitimately owns a scoped registry. The native parent-registration check therefore rejected a valid local owner before the actual turn could execute.

The PR ties scoped admission to the existing lifecycle authority contract. In plain terms, OpenClaw now allows this local path only when the runtime scope actually selects that registry. The fencing remains in place for retirement, first activation, replacement, and exact plugin-instance ownership.

## Why This Matters

Local Codex runs are a core workflow for builders who want an agent turn without leaning on a long-running Gateway. They are also a useful smoke test for native Codex integration because they exercise the task runtime, plugin registry, and command surface together.

The fix preserves that shape rather than weakening the ownership model. Registration-only contexts do not gain runtime authority, and the PR explicitly notes that exact plugin ownership remains fenced.

For users, the result should feel boring in the best way:

- `openclaw agent --local` can start native task work again.
- The local command keeps its scoped registry model.
- Gateway activation is not required for this local path.
- Existing runtime ownership checks still guard the broader system.

## Proof Included

The merged PR includes five local-scope regression cases that failed before the fix, plus a negative case to reject an overly broad alternative. Focused SDK, detached-runtime, and registry-lifecycle coverage passed across 73 tests, with the broader registry suite passing 186 tests.

The maintainers also ran a real supported local command through native Codex 0.155.1 using an isolated state setup. That command completed successfully, exited 0, and recorded the expected terminal receipt.

For OpenClaw users who prefer local-first workflows, this is a useful reliability repair: the agent turn admission boundary is back in line with how local commands are supposed to own their scoped runtime.
