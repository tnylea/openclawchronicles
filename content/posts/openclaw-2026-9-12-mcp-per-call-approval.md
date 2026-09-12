---
title: "OpenClaw Adds Per-Call Approval for MCP Tools"
excerpt: "OpenClaw now gates requester-scoped Codex MCP tools with per-call approval, closing a prompt-required tool authorization gap."
coverImage: '/assets/images/posts/openclaw-2026-9-12-mcp-per-call-approval.png'
date: '2026-09-12T23:02:00.000Z'
dateFormatted: September 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-12-mcp-per-call-approval.png'
---

OpenClaw merged an important Codex approval fix today in [PR #144631](https://github.com/openclaw/openclaw/pull/144631): requester-scoped MCP tools now pass through the same per-call approval boundary used by configured MCP tools.

The problem was subtle but serious. Prompt-required MCP tools coming from a requester-scoped connection could reach the Codex dynamic tool bridge without the interactive approval wrapper applied to static configured MCP tools. That meant an authenticated requester could expose a tool that advertised approval requirements, but a model-generated call could still execute the tool action without an operator decision.

The PR frames the net effect plainly: a prompt-required tool in a requester's configured MCP connection could execute without the per-call approval that the server's approval mode required.

## What Changed

OpenClaw now applies the shared approval wrapper to requester-scoped executable tools. Rather than adding a parallel approval path, the fix reuses the existing `applyConfiguredMcpApproval` machinery so configured and requester-scoped tools share the same enforcement behavior.

The change also carries the effective Codex session posture into requester materialization. Full-permission sessions keep their no-prompt behavior, while stricter postures prompt before dispatch.

There are two other important boundary decisions:

- OAuth sign-in bootstrap tools are exempt by provenance metadata, not by tool name.
- Requester-scoped prompts offer allow-once or deny, but not Allow Always, because requester grants do not have a stored grant consumer on that path.

That second point is a small but healthy product detail. Approval prompts should offer decisions the system can actually honor.

## Why It Matters

MCP approval boundaries are part of OpenClaw's operator trust model. If a tool declares that it needs a prompt before execution, users should be able to rely on that behavior regardless of whether the tool arrived through a configured connection or a requester-scoped path.

This fix does not remove tool availability for unmodified SDK callers that do not pass an approval callback. The PR explicitly preserves fail-open compatibility for those callers. OpenClaw's own requester turns, however, now pass the callback and receive the intended gate.

The result is a narrower and more consistent authority chain for Codex-backed MCP tools.

## Validation

The PR adds tests for requester-scoped prompt tools under deny and allow decisions. In the denied case, executor dispatch is blocked. In the allowed case, dispatch happens after approval. A real streamable-HTTP MCP server test counts server-side `tools/call` requests and verifies that denial produces zero calls while approval produces exactly one.

It also covers the provenance rule around OAuth bootstrap tools. A real server tool named `connect` is still gated like any other prompt-required tool; only the trusted bootstrap path is exempt.

For OpenClaw operators and plugin authors, [PR #144631](https://github.com/openclaw/openclaw/pull/144631) is a security-relevant approval consistency fix. Prompt-required requester tools now behave like prompt-required configured tools on OpenClaw's own Codex path.
