---
title: "OpenClaw Makes MCP Approval Dead Ends Actionable"
excerpt: "OpenClaw now gives Codex MCP users explicit approval controls and recovery hints when annotation-free tools would otherwise time out silently."
coverImage: '/assets/images/posts/openclaw-2026-8-16-mcp-approval-dead-ends.png'
date: '2026-08-16T23:00:00.000Z'
dateFormatted: August 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-16-mcp-approval-dead-ends.png'
---

OpenClaw merged a practical Codex workflow fix in [PR #124766](https://github.com/openclaw/openclaw/pull/124766), making MCP approval dead ends easier to diagnose and recover from when a server exposes tools without safety annotations.

The issue was sharpest in headless Codex harness runs. A normal MCP server added through `mcp add` could omit MCP safety annotations. OpenClaw's conservative default treated those tools as approval-required, but a headless turn had no live approver. The result was a long wait inside `plugin.approval.waitDecision`, followed by a generic rejection that did not tell the model or operator what to fix.

## What Changed

The MCP CLI now exposes an explicit approval mode through both setup and reconfiguration:

- `mcp add --approval auto|prompt|approve`
- `mcp configure --approval auto|prompt|approve`
- `mcp probe` and `mcp doctor --probe` warnings for annotation-free servers under the default `auto` mode
- clearer timeout recovery text for matching MCP approval requests

That last point matters because OpenClaw cannot always pass rich decline metadata through the upstream Codex contract. Instead, this patch scopes the recovery message to confirmed `mcp__*` approval timeouts, giving the model and operator a direct path: use the Control UI or configure a trusted-server override.

## The Security Default Stays Conservative

PR #124766 is deliberately not an auto-approval feature. The default remains cautious: when an MCP tool lacks safety annotations, OpenClaw still treats it as approval-required under `auto`.

The improvement is discoverability. Operators can now choose the already-supported approval behavior without editing raw JSON, and diagnostic commands can explain why an apparently ordinary MCP tool keeps getting blocked.

The PR also keeps the update path narrow. Reconfiguring a saved server merges only `codex.defaultToolsApprovalMode`, preserving `codex.agents` and unrelated server metadata.

## Why Operators Should Care

MCP is becoming the connective layer between agents and external capabilities. That makes approval behavior part of the daily operator experience, not an implementation detail. A conservative default is good, but an unexplained two-minute timeout is not.

This change gives trusted-server administrators three important handles:

- a visible configuration flag at add time
- a non-destructive way to adjust saved server policy later
- a diagnostic warning before an annotation-free server surprises a headless run

## Evidence From The PR

The PR reports 25 focused MCP CLI tests and 122 native-hook tests passing. It also includes built-CLI validation showing `mcp configure saved-server --approval approve` changing a saved mode from `auto` to `approve` while preserving `codex.agents`.

The author also notes that `pnpm build`, `node scripts/check-changed.mjs`, `pnpm docs:list`, source-blind built-CLI validation, and final autoreview passed after the final rebase.

For Codex-heavy OpenClaw operators, the effect is simple: MCP approval blocks should now fail with a map instead of a wall.
