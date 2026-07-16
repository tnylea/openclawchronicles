---
title: "OpenClaw Isolates LanceDB Memory by Agent"
excerpt: "OpenClaw fixed a LanceDB memory isolation gap so agents sharing one memory plugin cannot read or mutate each other's memories."
coverImage: '/assets/images/posts/openclaw-2026-7-16-lancedb-memory-isolation.png'
date: '2026-07-16T23:01:00.000Z'
dateFormatted: July 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-16-lancedb-memory-isolation.png'
---

OpenClaw merged a security-boundary fix for its LanceDB-backed memory plugin on July 16. [PR #103799](https://github.com/openclaw/openclaw/pull/103799), `fix(memory-lancedb): prevent cross-agent memory leakage`, landed at 10:33 UTC and closes a cross-agent memory isolation issue.

The bug affected agents sharing the same LanceDB memory plugin. According to the PR, one agent could read, list, delete, or automatically recall another agent's memories. Turning off `memorySearch` only stopped automatic hooks; it did not fully isolate the shared tools or backing table.

## What Changed

The fix adds an owning agent ID to every LanceDB memory row and requires that owner across the memory surface. Store, search, list, query, count, and delete paths now enforce the normalized owner before returning or mutating rows.

OpenClaw also tightens the surrounding runtime plumbing. Plugin tools are registered per agent, ACP-managed MCP delegates propagate the canonical session agent, and automatic recall and capture use the same live per-agent gate.

That matters because memory leaks rarely come from one obvious path. A memory system can be exposed through tool calls, automatic capture, automatic recall, CLI commands, gateway sessions, or delegated MCP calls. The PR frames this as a single ownership rule applied across those entry points.

## Existing Tables Fail Closed

The migration path is intentionally conservative. Existing shared LanceDB tables fail closed until `openclaw doctor --fix` runs a one-time migration.

Legacy rows do not contain a trustworthy owner, so the migration assigns them to the configured default agent, verifies the updated schema, and checks the row count. That avoids silently treating old shared rows as safely partitioned.

Operators should read that as a security-first migration posture: the system prefers an explicit repair step over continuing to serve ambiguous memory rows across agents.

## Why It Matters

OpenClaw's memory layer is one of the most sensitive surfaces in a multi-agent setup. Memories can contain preferences, project context, personal notes, credentials-adjacent hints, and operational state. If one agent can query another agent's memory, the separation between roles becomes much weaker.

The fix is especially important for teams that run multiple agents through one OpenClaw installation. A support agent, coding agent, home automation agent, and admin agent may all be useful in one workspace, but they should not automatically share recall state just because they use the same LanceDB plugin.

## Evidence

The PR reports 202 focused tests across the LanceDB store and plugin, doctor migration, ACP runtime, and MCP plugin-tool server. It also cites a full `pnpm check:changed` run, including TypeScript, lint, formatting, SDK-surface, database-first, cycle, and repository guards.

The strongest proof is the live gateway test described in the PR. Two agents exercised `/tools/invoke`, automatic capture, automatic recall, CLI listing, and a gateway restart. The reported result was that tools, capture, recall, and restart persistence all stayed isolated.

## Operator Takeaway

If you run multiple OpenClaw agents with LanceDB memory enabled, this is a high-priority fix to track. The main behavior change is not a new memory feature; it is a clearer ownership contract for existing memory operations.

The practical takeaway is simple: shared memory infrastructure should not mean shared memory authority. PR #103799 moves LanceDB memory closer to that rule.
