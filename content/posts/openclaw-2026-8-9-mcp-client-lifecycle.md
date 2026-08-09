---
title: "OpenClaw Tightens MCP Client Lifecycle Ownership"
excerpt: "OpenClaw PR #120894 keeps MCP discovery clients leased through async work, reducing missing tools and stale requester-runtime mappings."
coverImage: '/assets/images/posts/openclaw-2026-8-9-mcp-client-lifecycle.png'
date: '2026-08-09T08:07:00.000Z'
dateFormatted: August 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-9-mcp-client-lifecycle.png'
---

OpenClaw merged [PR #120894, "fix(mcp): preserve client and requester lifecycle ownership"](https://github.com/openclaw/openclaw/pull/120894), a P1 Gateway and agent reliability fix for MCP discovery through Codex app-server clients.

The issue was lifecycle ownership. MCP discovery could release a bound Codex app-server client before cursor pagination finished. Anonymous requester-scoped calls could also sweep unrelated runtimes and overwrite session-key state before confirming the requester owner. Nearby cleanup paths had their own holes: adopted Codex resources could leak after post-start failures, and gracefully detached clients could be missed during global shutdown.

The result was intermittent and hard to diagnose: missing MCP tools, stale runtime mappings, leaked app-server resources, or shutdowns that left detached clients alive.

## What Changed

The repair moves ownership checks and releases to the lifecycle owners that actually know when work is finished.

Requester identity is now validated before shared state is mutated. Clients that need to survive asynchronous discovery work remain leased until that work settles. Post-start and terminal cleanup paths release fundamental resources reliably, and global disposal tracks physical clients independently of the acquisition map.

That may sound internal, but it affects a very visible surface: whether the right MCP tools appear and stay available when Codex-backed app-server discovery is paginating, collecting status, or cleaning up after a failed run attempt.

## Why It Matters

MCP tools are becoming one of the main ways OpenClaw agents reach external capabilities. Tool discovery has to be boringly reliable because users rarely see the machinery underneath it. They only see that a tool is missing, stale, or mapped to the wrong requester.

PR #120894 hardens the boundary between three moving pieces:

- The requester that owns the runtime mapping.
- The bound Codex app-server client doing discovery work.
- The cleanup owner responsible for releasing resources at the end.

The important product direction is that OpenClaw is not adding a second source of truth or a retry bandaid in the request path. It is preserving the ownership model so async work cannot outlive the client lease that makes the work valid.

## Validation

The PR reports 277 focused boundary tests across effective catalog behavior, shared-client lifecycle, run-attempt cleanup, and requester-runtime suites.

The changed-file gate also passed formatting, guard tests, SDK and API contracts, plugin boundaries, dead-code scans, all four TypeScript lanes, targeted lint, schema and store guards, and import-cycle checks. Exact-head CI initially found an unrelated Gateway profile-state flake; that test was updated to own a per-test SQLite state root, then passed repeated focused runs and a 4,887-test Gateway core envelope.

One validation gap is stated directly: no live Gateway or app-server end-to-end run was performed. That leaves a small residual integration risk, but the source-linked tests cover the lifecycle boundaries that changed.

For users building on OpenClaw's Gateway, Codex, and MCP surfaces, this is an important reliability fix: discovery clients stay alive long enough to finish their work, requester state is not mutated before ownership is known, and cleanup has a clearer owner.
