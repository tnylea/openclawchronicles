---
title: "OpenClaw Plugin Approval Hooks: Requiring Human Sign-Off Before Tools Run"
excerpt: "OpenClaw's new requireApproval hook lets plugins pause any tool call and demand explicit human approval via CLI, Telegram, Discord, or the /approve command."
coverImage: '/assets/images/posts/openclaw-2026-3-28-plugin-approval-hooks.png'
date: '2026-03-28T23:30:00.000Z'
dateFormatted: March 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-28-plugin-approval-hooks.png'
url: '/posts/openclaw-2026-3-28-plugin-approval-hooks/'
---

Buried in tonight's `2026.3.28-beta.1` release is a feature that self-hosters concerned about agentic overreach have been waiting for: **plugin-level tool approval gates**. With [#55339](https://github.com/openclaw/openclaw/pull/55339), plugins can now intercept any tool call before execution and require a human to explicitly approve or deny it.

This is different from the existing exec approval flow, which only covers shell commands run via the `exec` tool. The new system covers *any* tool — file writes, API calls, database mutations, whatever your plugins expose.

## How It Works

The feature ships as an async `requireApproval` callback on `before_tool_call` hooks. When a plugin registers this callback, OpenClaw pauses the agent's tool execution and presents an approval prompt before proceeding.

```js
// Conceptual plugin structure (from the PR description)
plugin.hooks.before_tool_call = async (toolCall, ctx) => {
  if (toolCall.name === 'write_file' || toolCall.name === 'run_sql') {
    return {
      requireApproval: true,
      summary: `Agent wants to run: ${toolCall.name}`,
    };
  }
};
```

The agent blocks until the user responds. If the user approves, the tool runs normally. If they deny, the tool call is cancelled and the agent receives a rejection signal.

## Multi-Platform Approval Surfaces

One of the more interesting implementation details: the approval prompt surfaces differently depending on your channel configuration.

- **CLI** — Uses the existing exec approval overlay (same UX as shell command approvals)
- **Telegram** — Renders as inline buttons (Approve / Deny) in the chat
- **Discord** — Uses Discord interaction buttons, so the approval feels native to the platform
- **Any other channel** — Falls back to the `/approve` command, which has been unified to handle both exec and plugin approvals

The `/approve` command now accepts both approval types with automatic fallback, so if you're on a channel without native button support, the text-based flow still works cleanly.

## Why This Matters for Agentic Deployments

The core tension in agentic AI is capability vs. oversight. More tools = more useful. More tools = more surface area for mistakes. Until now, OpenClaw gave you a binary choice: trust the agent to run tools autonomously, or limit what tools it can access.

Plugin approval hooks introduce a middle path. You can give the agent access to powerful tools — file system writes, external API calls, destructive database operations — while still keeping a human in the loop for the actions that warrant it. The agent proposes; you dispose.

This is particularly useful for:

- **Shared deployments** where multiple users interact with the same agent and you want audit trails
- **Production-adjacent environments** where you want automation with a safety net
- **Custom plugins** that perform irreversible actions (sending emails, posting to social media, modifying infrastructure configs)

## The `/approve` Unification

A secondary improvement in the same PR: the `/approve` command now handles both exec approvals (shell commands) and plugin approvals in a single unified flow. Previously these were separate command paths, which caused confusion when users tried to approve a plugin action using the exec approval syntax.

The new behavior: `/approve` checks both pending queues and routes the approval to the correct handler automatically. If you have approval prompts queued from both exec and plugin sources, it handles them in order.

## Combining with `before_dispatch`

For plugin authors, the `before_tool_call` approval hook pairs well with the `before_dispatch` hook that shipped in `2026.3.24`. `before_dispatch` lets you inspect and modify inbound messages before they reach the agent. `before_tool_call` with `requireApproval` lets you gate outbound tool execution. Together, they give plugins fairly comprehensive control over the agent's input/output boundary.

## Getting Started

The feature is in beta as of `2026.3.28-beta.1`. Install with:

```bash
npm install -g openclaw@beta
```

Plugin authors can start implementing `requireApproval` callbacks now. The feature is documented in the [OpenClaw docs](https://docs.openclaw.ai) under Plugins/Hooks. For the full PR discussion, see [#55339](https://github.com/openclaw/openclaw/pull/55339) — thanks to [@vaclavbelak](https://github.com/vaclavbelak) and [@joshavant](https://github.com/joshavant) for the implementation.
