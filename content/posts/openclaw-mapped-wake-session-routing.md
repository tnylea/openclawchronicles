---
title: "OpenClaw Mapped Wake Hooks Now Route Correctly"
excerpt: "OpenClaw fixed mapped wake hooks so successful multi-agent events reach the configured agent and session instead of the default main session."
coverImage: '/assets/images/posts/openclaw-mapped-wake-session-routing.png'
date: '2026-07-29T23:01:00.000Z'
dateFormatted: July 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-mapped-wake-session-routing.png'
---

OpenClaw merged a focused Gateway fix tonight for one of the more subtle failure modes in multi-agent automation. [PR #116109](https://github.com/openclaw/openclaw/pull/116109), titled `fix(hooks): route mapped wakes to configured sessions`, changes how mapped `action: "wake"` hooks carry their target agent and session through the runtime.

Before the patch, a user could configure a mapped wake hook with an `agentId` or `sessionKey`, receive a successful response, and still have the event silently queued for the default main session. That is the kind of bug that makes automations look healthy from the outside while sending work to the wrong place.

## What Changed

The fix makes mapped wake routing use the same target policy that OpenClaw already applies to hook agent and session selection. The PR says the event queue key and heartbeat target are now canonicalized together, which matters because the queue and the wake target need to agree on where the pending work belongs.

The legacy behavior is still preserved for mappings that do not name a target. Untargeted wake mappings continue to route to the default main session.

The patch also tightens edge cases around custom session keys:

- Custom session keys remain limited to immediate wakes.
- Deferred heartbeat routing rejects arbitrary custom-session queues.
- Explicit templated session keys that render empty fail closed.
- Invalid or policy-disallowed targets return an error instead of routing elsewhere.

## Why It Matters

Hooks are one of the ways OpenClaw turns outside events into agent work. When those hooks are mapped into a multi-agent setup, target accuracy becomes part of the security and reliability boundary. A wake intended for a specialized agent should not wake the default assistant just because the delivery path lost the configured target.

That matters for setups where agents have different tools, memory, channel bindings, or operating rules. A deployment might use a support agent for inbox events, a coding agent for repository hooks, and a personal agent for owner-directed messages. Silent fallback to the main session makes that architecture harder to trust.

The labels on the PR reflect that risk: `gateway`, `P2`, `merge-risk: session-state`, and `merge-risk: message-delivery`.

## Verification

The PR reports 90 focused hook mapping, request-handler, and Gateway tests. Regression coverage includes per-agent routing, custom sessions, global session scope, target policy, deferred wake rejection, transform overrides, and empty templated-session rejection for both wake and agent actions.

For operators, the takeaway is simple: mapped wake hooks should now be easier to reason about. If a mapping names an allowed agent or session, OpenClaw routes there. If the target is invalid, OpenClaw errors instead of pretending the request succeeded somewhere else.
