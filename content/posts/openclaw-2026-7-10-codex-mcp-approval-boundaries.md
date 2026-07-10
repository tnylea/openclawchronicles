---
title: "OpenClaw Tightens Codex and MCP Approval Boundaries"
excerpt: "OpenClaw now routes risky Codex app-server commands and group MCP config views through stricter human and private-delivery boundaries."
coverImage: '/assets/images/posts/openclaw-2026-7-10-codex-mcp-approval-boundaries.png'
date: '2026-07-10T08:02:00.000Z'
dateFormatted: July 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-10-codex-mcp-approval-boundaries.png'
---

OpenClaw merged two July 10 security-boundary fixes that share the same operating principle: when the system cannot prove a request is safe in the current context, move the decision or the output to a narrower human-controlled path.

The first is [PR #103457, "fix(codex): require human approval for app-server commands"](https://github.com/openclaw/openclaw/pull/103457). The second is [PR #103502, "fix(mcp): keep server config private in groups"](https://github.com/openclaw/openclaw/pull/103502). Together, they tighten execution approval and configuration visibility around two sensitive agent surfaces.

## Codex App-Server Commands Now Wait for a Human

PR #103457 removes an automatic low-risk review path for Codex app-server command approvals. The issue was not that every command was dangerous. The issue was that Codex app-server approval requests did not expose an enforceable resolved executable.

That matters because an approval decision should be bound to what will actually run. The PR explains that the request carries command, working directory, and action information, but not a resolved executable that OpenClaw can enforce. In that situation, a low-risk automatic decision could approve a shape of work without being tied tightly enough to the runtime execution plan.

OpenClaw now keeps explicit runtime and native policy decisions intact, but otherwise sends those app-server command approvals through the existing plugin approval route for human review.

The user impact is intentionally conservative: commands that previously could receive a low-risk automatic review now wait for human approval unless a stronger policy path already decided the request.

## MCP Config Views Stay Private in Groups

PR #103502 addresses a different kind of boundary: where configuration output appears.

The affected command is `/mcp show`. In a group context, an owner inspecting MCP configuration could still expose credentials stored in stdio arguments or owner/plugin-specific fields. Earlier redaction covered headers, environment variables, and credentialed URLs, but argv can be opaque enough that field-name redaction alone is not a reliable safety guarantee.

The fix changes group behavior. OpenClaw resolves a private owner route before reading or rendering configuration. It sends the sanitized result privately, and the group receives only a constant acknowledgment. If private delivery is missing or fails, the group output fails closed rather than showing server names, paths, or configuration data.

Direct and DM output also gained more argv-focused redaction for recognized credential flags and secret-shaped argument values, while preserving non-secret argv for normal inspection and round trips.

## Why These Fixes Fit Together

Both patches are about refusing to infer trust from incomplete context.

In the Codex case, OpenClaw cannot enforce a resolved executable for one approval surface, so it asks a human. In the MCP case, OpenClaw cannot prove every argument is safe to display in a shared room, so it moves the rendered config to a private route and keeps group output constant.

That is the right pattern for agent infrastructure. Automation should be fast where the policy boundary is clear, and deliberately slower where the proof is incomplete.

## Validation

PR #103457 reports 78 passing approval-bridge tests, changed-code checks, and a regression proving the low-risk reviewer is not invoked and cannot override a human denial.

PR #103502 reports 42 focused tests across MCP command routing, config restoration, and argv redaction, plus live ephemeral Gateway coverage for display flow and argv sentinel round trips. Group regressions cover successful private delivery, missing routes, delivery failure, fallback owner routes, constant group output, and sanitized private payloads.

## Bottom Line

OpenClaw's latest security-boundary work is not flashy, but it is practical. Codex app-server commands now require a stronger approval path when executable enforcement is unavailable, and MCP configuration inspection no longer spills sensitive server details into group rooms.
