---
title: "OpenClaw Tightens Private Subagent Reply Policy"
excerpt: "OpenClaw PR #156540 fixes yielded private subagent completions so resumed parent replies follow the conversation's delivery policy."
coverImage: '/assets/images/posts/openclaw-2026-10-1-private-subagent-yield-policy.png'
date: '2026-10-01T08:02:00.000Z'
dateFormatted: October 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-1-private-subagent-yield-policy.png'
---

OpenClaw merged a P1 agent-delivery fix Thursday morning for private subagent workflows. [PR #156540](https://github.com/openclaw/openclaw/pull/156540), titled "fix(subagents): yielded requests go unanswered after a private subagent completes," closes a subtle reply-policy gap around yielded private child runs.

The bug had two sides. A request could go unanswered after a private subagent completed, or the resumed parent could bypass a message-tool-only reply setting when it produced an ordinary final answer.

## What Yielding Is Supposed to Do

Yielding hands completion back to the requester. It does not create permission to ignore the original conversation's delivery rules.

That distinction matters in OpenClaw because conversations can have different reply policies. Some rooms allow automatic final replies. Others require explicit use of the message tool, so an ordinary final answer should stay private unless the agent sends through the approved channel tool.

The PR moves enforcement to the resumed Gateway command path. The resumed parent now uses the existing reply-policy owner for the effective run and enforces that policy at delivery, not just in prompt text.

## User Impact

The intended behavior is clearer after the fix:

- Automatic conversations can receive the resumed parent's ordinary final reply.
- Message-tool-only conversations keep ordinary final text private.
- Private child output stays internal.
- Replaced or reset requester sessions do not receive stale findings.
- Host-owned diagnostics and media retain their existing delivery grants.

That means private subagent work can still be useful without turning into an accidental public reply path. It also means a yielded request is less likely to disappear silently after the child finishes.

## Why This Was Tricky

The PR history shows why this area is delicate. The Gateway has to distinguish successful silence, failed delivery, pending work, confirmed delivery, restart markers, reset requester sessions, and private-batch protections. It also has to preserve identity across child completion, parent resumption, and conversation policy.

The fix avoids treating suppressed plain finals as restart-delivery markers and avoids triggering repeated settle turns. That is important because a policy-suppressed final should not become a retry loop or later leak.

## Validation

The pull request includes extensive live Telegram Test Server proof in addition to focused tests. The reported matrix covered message-tool-only rooms where an ordinary final produced zero final messages, automatic rooms where the same final delivered once, and message-tool-only rooms where an actual `message` tool send delivered once without duplicates.

Additional cells covered reset-pending, reset-admitted, upgrade-released, upgrade-stripped, and upgrade-control cases. The PR also reports hundreds of focused tests across command policy, delivery, maintenance, announcement, yielded-settle behavior, and reply-policy boundaries.

For OpenClaw users who rely on private subagents, this is a meaningful safety and reliability repair. A resumed parent should answer when policy allows it, stay quiet when policy requires message-tool delivery, and keep private child output private.
