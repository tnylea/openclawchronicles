---
title: "OpenClaw Adds Claude Tool Approval Relay"
excerpt: "OpenClaw now routes Claude native tool requests through Gateway approvals, giving restrictive exec policies a real human-in-the-loop path."
coverImage: '/assets/images/posts/openclaw-2026-7-23-claude-gateway-approvals.png'
date: '2026-07-23T08:00:00.000Z'
dateFormatted: July 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-23-claude-gateway-approvals.png'
---

OpenClaw merged a substantial Claude Code integration change in [PR #112918](https://github.com/openclaw/openclaw/pull/112918), adding a Gateway-backed approval relay for Claude native tool requests. The patch targets a frustrating gap in restrictive environments: Claude could ask to use native or extension tools, but OpenClaw's `can_use_tool` handler either allowed everything under YOLO policy or silently denied everything under tighter policies.

That made restricted Claude CLI sessions safer, but also much less useful. A tool request that should have been reviewable by the operator was instead blocked with no real human-in-the-loop path.

## What Changed

The new implementation introduces `claude-live-tool-approval.ts`, which resolves approval behavior from the effective exec policy and sends Claude tool requests through the existing Gateway approval system. That means OpenClaw did not add a second approval transport or a new persistence model. It reuses the same two-phase `plugin.approval.request` and decision-wait flow already used by the plugin approval broker.

For users, the visible difference is straightforward: under an approval-based exec policy, Claude CLI sessions can now surface prompts such as Allow once, Allow always, or Deny to the session channel instead of failing the tool call automatically.

## Why This Matters

Claude's native tool surface is growing beyond simple shell operations. The PR specifically calls out Claude's Bash and WebFetch tools, Claude in Chrome browser tools, and the new 1Password for Claude credential autofill path. Without an approval bridge, restrictive OpenClaw operators had to choose between broad YOLO-style execution and a Claude backend that could not use key native capabilities.

This patch gives OpenClaw a more practical middle ground. Operators can keep policy gates in place while still approving individual tool use when the request is understandable and appropriate.

## The Guardrails

The PR is careful about policy boundaries. YOLO behavior stays the same and allows immediately. A deny policy still denies immediately. `ask: "off"` does not prompt, so allowlist mode remains a deny-without-prompt path when a request falls outside the allowed set. `ask: "always"` prompts every time and does not mint reusable grants.

The patch also avoids one risky shortcut: Bash does not receive an Allow always grant. A persistent tool-name grant for Bash would effectively become unrestricted execution, so Bash approvals stay one-shot. Oversized Bash input fails closed with a split-and-retry message, and truncated approval descriptions preserve the head and tail with a hidden-size marker rather than dumping an unbounded payload into the prompt.

## Docs and Proof

The change updates `docs/gateway/cli-backends.md` with the approval relay and Chrome passthrough behavior, adds `docs/gateway/1password.md` for browser sign-in requirements, and adjusts the bundled 1Password skill with rules that keep passwords and OTPs out of chat relay paths.

The test evidence is broad: 21 focused approval tests passed, 101 CLI runner spawn tests passed, and 46 Anthropic shared CLI tests passed. The author also reports clean TypeScript, lint, formatting, diff checks, and a final Codex autoreview round with no actionable findings.

## Operator Takeaway

This is a strong OpenClaw security-and-usability patch. Restrictive Claude sessions should no longer feel artificially broken when a native tool needs review, and operators do not have to loosen the whole exec policy just to let Claude complete a narrowly approved action.

For teams experimenting with Claude Code, browser tools, or 1Password-backed workflows inside OpenClaw, Gateway approvals are now the control point to watch.
