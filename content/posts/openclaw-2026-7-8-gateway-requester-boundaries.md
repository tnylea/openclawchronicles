---
title: "OpenClaw Narrows Gateway Trust Boundaries"
excerpt: "OpenClaw tightens Gateway requester provenance and blocks non-owner chat runs from receiving privileged control tools."
coverImage: '/assets/images/posts/openclaw-2026-7-8-gateway-requester-boundaries.png'
date: '2026-07-08T23:05:00.000Z'
dateFormatted: July 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-8-gateway-requester-boundaries.png'
---

OpenClaw merged two P0 Gateway hardening PRs after the morning run: [PR #102031, "fix: gate Gateway message action requester provenance"](https://github.com/openclaw/openclaw/pull/102031), and [PR #102030, "fix: restrict non-owner gateway tool inventory"](https://github.com/openclaw/openclaw/pull/102030).

Together, they narrow the trust boundary between public Gateway clients, channel-provided identity, and the privileged control tools an agent can see during a chat-driven run.

## Requester Provenance Is Now Gated

PR #102031 fixes a requester identity issue in `message.action` requests. Before the change, a write-scoped Gateway client could provide requester identity fields and have those fields treated as trusted channel provenance downstream.

The fix makes requester account and sender provenance behave like other trusted channel-action context. Only full-scope callers can bridge server-injected requester identity through the public RPC boundary.

Write-scoped clients can still invoke supported message actions. The important change is that caller-supplied requester identity and owner status are stripped before channel dispatch.

That keeps the normal workflow intact while removing a spoofing path for actions that depend on trusted sender identity.

## Non-Owners Lose Owner-Only Tools

PR #102030 addresses a related tool-inventory problem. Users with explicit non-owner Gateway access could have owner-only Gateway control tools included in chat-driven agent runs.

The shared agent tool-policy pipeline now treats explicit non-owner sender identity as a hard deny for owner-only Gateway core tools. The rule applies before the final model tool inventory is returned, including inherited tool surfaces for spawned sessions and scheduled follow-up jobs.

The PR's proof showed owner/admin WebChat runs keeping `cron`, `gateway`, and `nodes`, while explicit non-owner WebChat returned no protected owner-only tools.

## Why This Matters

Gateway identity is not just metadata. It determines whether a request is allowed to act like the owner, whether a channel action can trust its requester, and which control tools a model can call.

These PRs tighten two different stages:

- Input provenance: write-scoped clients cannot spoof trusted requester fields.
- Tool exposure: explicit non-owner chat turns do not receive owner-only Gateway, scheduler, or node-control tools.

That combination matters because agent safety is often about preventing privilege from appearing too early. If a non-owner run never receives the tool, the model cannot accidentally or intentionally use it.

## Validation

PR #102031 reports `git diff --check` and 124 passing tests in `src/gateway/server-methods/send.test.ts`.

PR #102030 reports focused tests for agent tool configuration and OpenClaw coding tool creation: 24 tests in `agent-tools-agent-config.test.ts` and 68 tests in `agent-tools.create-openclaw-coding-tools.test.ts`. It also includes a current-head local adapter proof for owner versus non-owner WebChat inventory.

Both PRs note that remote Testbox validation was attempted but blocked by local environment constraints, so the published evidence is local and focused.

## Bottom Line

OpenClaw's Gateway surface is getting stricter about who can claim identity and who can see privileged tools. For multi-user chat, WebChat, and channel-driven agents, that is exactly the kind of boundary that should be enforced before a model turn begins.
