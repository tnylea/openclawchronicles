---
title: "OpenClaw Fixes Duplicate And Lost Delivery"
excerpt: "OpenClaw PR #120108 fixes duplicate agent delivery, lost recovery notices, and idempotency gaps in Gateway send and poll paths."
coverImage: '/assets/images/posts/openclaw-2026-8-7-agent-delivery-recovery.png'
date: '2026-08-07T08:03:00.000Z'
dateFormatted: August 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-7-agent-delivery-recovery.png'
---

OpenClaw merged [PR #120108, "fix: prevent duplicate and lost agent delivery"](https://github.com/openclaw/openclaw/pull/120108), a Gateway and agents reliability fix aimed at production delivery failures.

The PR groups three related problems under one practical theme: agent output must arrive once, under the right identity, and through the normal durable delivery path.

That sounds simple until a self-hosted assistant is juggling sub-agents, lifecycle turns, message-tool sends, polls, restarts, and channel plugins with different delivery capabilities.

## Three Failure Modes

The first failure involved synthetic sub-agent and lifecycle turns. Those turns could invalidate an existing Claude CLI session and reseed it from a lossy text-only transcript. In practice, that meant internal activity could disturb a stable CLI binding and invite repeated agent actions from reconstructed history.

The second problem was idempotency. Message-tool sends and polls could discard their host-generated idempotency key before reaching the Gateway. Without that key, retry behavior gets much harder to reason about because the system loses the logical identity of the delivery attempt.

The third problem involved failed-session recovery notices. Those notices could bypass normal outbound delivery and disappear on Signal and other plugins that intentionally do not implement send as a message action.

Together, these bugs covered both sides of a bad delivery story: some work could repeat, while other visible notices could vanish.

## The Repair

OpenClaw now keeps turn-local reply policy separate from an existing session's stable CLI binding policy. That lets synthetic turns do their internal work without unnecessarily rebinding or reseeding a CLI session.

Core outbound send and poll paths now carry the host-owned idempotency key end to end. That gives Gateway-mode retries the same logical delivery identity instead of making each retry look like a fresh, unrelated action.

For failed main-session recovery notices, the PR moves delivery onto a typed Gateway-owned normal outbound path with durable delivery identity. It does not fall back to plugin message actions, and it does not mirror the notice into a rebound transcript.

## User Impact

The visible result should be calmer delivery behavior.

Sub-agent completions and lifecycle turns should no longer force unnecessary Claude CLI reseeds. Retried Gateway-mode sends should retain the same delivery identity. Operators on Signal and similar outbound-only plugins should receive the visible notice when a main session cannot be resumed after restart.

That last part matters because a recovery notice is not optional polish. If the main session cannot resume, the operator needs to know. Silent failure at that point turns a recoverable incident into confusion.

## Validation

The PR reports 563 tests passing across nine focused files, covering source reply delivery mode, agent commands, main-session restart recovery, Gateway runtime behavior, media and poll outbound runners, channel delivery, outbound send service, and the message tool.

It also reports passing TypeScript, test-type checks, targeted lint, full build, diff checks, and a clean Codex autoreview.

For OpenClaw operators, PR #120108 is a reminder that delivery reliability is a chain. Session binding, idempotency, retry routing, and channel-specific outbound behavior all have to agree. This fix tightens that chain where production had already found weak links.
