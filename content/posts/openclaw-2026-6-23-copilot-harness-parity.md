---
title: "OpenClaw Brings Copilot Harness Closer to Codex"
excerpt: "OpenClaw adds shared harness helpers so Copilot gains ask_user support and compact tool routing closer to Codex and PI behavior."
coverImage: '/assets/images/posts/openclaw-2026-6-23-copilot-harness-parity.png'
date: '2026-06-23T08:02:00.000Z'
dateFormatted: June 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-23-copilot-harness-parity.png'
---

OpenClaw merged [PR #96005](https://github.com/openclaw/openclaw/pull/96005), a large Copilot harness update that brings its behavior closer to the Codex and PI agent lanes.

The headline change is parity. Copilot was missing several harness capabilities that other OpenClaw-backed agents already had: interactive `ask_user`, compact tool-search and code-mode routing, and shared user-input formatting logic. This PR moves those behaviors into reusable harness helpers instead of leaving each provider lane to reinvent them.

## Shared Harness Helpers

The patch adds shared helpers for two important pieces of agent runtime behavior.

First, it standardizes user-input prompt delivery and answer normalization. Copilot now wires SDK `ask_user` through OpenClaw active-run queueing, including channel-safe prompt escaping and abort cleanup. Codex request-user-input formatting is also refactored onto the shared helper while keeping Codex app-server protocol parsing local.

Second, Copilot now routes tool-search and code-mode behavior through a shared compact catalog helper. That includes hidden-catalog allowlist filtering, cleanup, docs updates, and support for source-qualified tool entries from the Copilot SDK.

## Why This Matters

Harness parity is not just internal polish. OpenClaw is increasingly a multi-provider runtime, and users expect core interaction patterns to behave consistently across agent backends.

If one lane can pause and ask a user a structured question while another cannot, workflows become provider-specific. If one lane sees a compact, policy-aware tool surface while another takes a different path, testing and debugging get harder. Shared helpers reduce that drift.

This also matters for future maintenance. By moving common user-input and compact-tool behavior into generic harness helpers, OpenClaw makes it easier to bring the next provider lane up to the same standard without copying provider-specific glue.

## Proof And Scope

The PR cites Copilot SDK contracts for `availableTools` and built-in `ask_user`, along with Codex protocol and session references for request-user-input behavior. That dependency check is useful because this work sits at the boundary between OpenClaw's harness layer and provider-specific SDK behavior.

Validation included focused Vitest runs for the plugin SDK harness runtime, Codex user-input bridge, Copilot user-input bridge, Copilot attempts, and Copilot tool bridge. A live Copilot agent test also passed against local GitHub/Copilot auth, and the final changed-lane Testbox run passed.

For OpenClaw users, the practical result is that Copilot-backed agent runs should now feel less like a special case. They can participate in the same interactive prompt and compact tool-routing patterns that have become part of the broader OpenClaw runtime.
