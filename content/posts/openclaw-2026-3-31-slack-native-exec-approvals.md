---
title: "OpenClaw Brings Native Exec Approvals to Slack"
excerpt: "OpenClaw main now routes exec approval requests through Slack natively, matching the Discord and Telegram approval UX with configurable approvers and session filters."
coverImage: '/assets/images/posts/openclaw-2026-3-31-slack-native-exec-approvals.png'
date: '2026-03-31T08:00:00.000Z'
dateFormatted: March 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-31-slack-native-exec-approvals.png'
---

Slack users running OpenClaw have been waiting for this one. [PR #58155](https://github.com/openclaw/openclaw/pull/58155) by [@vincentkoc](https://github.com/vincentkoc) lands Slack-native exec approval routing on `main`, bringing Slack to feature parity with Discord and Telegram on the approval front. This is not yet in a stable release — it will ship in the next version beyond v2026.3.28.

## What Are Exec Approvals?

OpenClaw added `requireApproval` for `before_tool_call` plugin hooks in v2026.3.28. This lets any plugin pause an agent's tool execution mid-run and demand explicit user confirmation before proceeding. It's a key safety mechanism for agents that interact with sensitive systems — think `rm -rf`, production API writes, or anything irreversible.

Until now, approval delivery worked natively on **Discord** (inline buttons) and **Telegram** (inline keyboard), but Slack was conspicuously missing from the party. Your agent would need to fall back to the generic `/approve` command workflow instead of getting a clean Slack-native approval prompt.

## What Changes in PR #58155

The PR introduces two new Slack-specific modules:

**`exec-approvals.ts`** handles the routing decision. It evaluates `agentFilter` and `sessionFilter` before accepting any approval request — meaning you can scope approvals to specific agents or sessions within your Slack workspace. The approver resolution logic works in priority order: explicit approver list first, then `allowFrom` / `dm.allowFrom` / `defaultTo` fallbacks. The `normalizeSlackApproverId` function accepts multiple formats: bare `U123` IDs, `user:U123`, and `slack:U123`.

**`approval-native.ts`** builds the actual Slack native approval adapter via the shared `createApproverRestrictedNativeApprovalAdapter` factory — the same infrastructure Discord and Telegram use. Origin-target resolution reconciles the turn's `sourceTo` against the session-derived target and returns null on a mismatch (conservative and safe).

The existing `approval-auth.ts` is simplified by delegating to these new helpers, and `channel.ts` is updated to wire the new adapter in.

One honest note from the PR: `shouldSuppressLocalSlackExecApprovalPrompt` is currently pinned to `false` with an explicit comment explaining that the Slack runtime doesn't yet have a native prompt delivery handler. The infrastructure is in place, but the interactive prompt UI within Slack itself is still pending. In the meantime, the approval request will still be routed correctly — it just won't appear as a native Slack message action button yet.

## How to Configure It

Once this ships in a stable release, Slack exec approvals will be configurable via the new `SlackExecApprovalConfig` schema. You can specify:

- **Explicit approver list** — Slack user IDs who can approve tool-call requests
- **`agentFilter`** — restrict approvals to a specific agent
- **`sessionFilter`** — restrict approvals to a specific session

This makes it practical to run a single OpenClaw gateway on a shared Slack workspace where different agents or users have different approval authorities.

## Approval Parity Across Channels

With this PR merged, the exec approval ecosystem is maturing nicely:

| Channel | Approval Support |
|---------|-----------------|
| Discord | ✅ Native (inline buttons) |
| Telegram | ✅ Native (inline keyboard) |
| Slack | ✅ Routing + auth (native UI pending) |
| All channels | ✅ `/approve` command fallback |

The broader approval architecture was also cleaned up last week via [PR #57838](https://github.com/openclaw/openclaw/pull/57838), which unified the Discord and Telegram exec-approval flows into a shared `createExecApprovalChannelRuntime` factory. Slack is now built on top of that same foundation.

## Looking Ahead

The remaining piece — rendering native Slack interactive buttons for approval prompts — is clearly on the roadmap. Given the infrastructure is now in place, expect a follow-up PR to close that gap before the next major release. When it lands, OpenClaw's Slack integration will have the cleanest agent approval flow of any chat platform it supports.

Follow the issue at [openclaw/openclaw#58155](https://github.com/openclaw/openclaw/pull/58155).
