---
title: "OpenClaw Shows Queued Runs In Agent Session Lists"
excerpt: "OpenClaw now preserves queued run status in sessions_list, helping agents distinguish waiting child work from idle sessions."
coverImage: '/assets/images/posts/openclaw-2026-8-29-queued-session-status.png'
date: '2026-08-29T08:03:00.000Z'
dateFormatted: August 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-29-queued-session-status.png'
---

OpenClaw merged a small but useful agent-runtime fix at the edge of the August 29th morning scan window. [PR #131444](https://github.com/openclaw/openclaw/pull/131444), merged at 07:58 UTC, preserves the Gateway's valid `queued` run status when agents call the `sessions_list` tool.

The issue was a projection mismatch. The Gateway already knew when an admitted run was waiting for a concurrency slot, and its session row could represent that state as `queued`. But the model-facing `sessions_list` output dropped that value, so the agent saw no status for a child session that was actually admitted and waiting.

That made queued work look too much like idle work.

## The Gateway Schema Becomes The Source Of Truth

The repair uses the Gateway protocol's `SessionRunStatusSchema` as the shared runtime owner across the relevant boundaries: the Gateway row, the model-facing output schema, and the agent-tool narrowing check. Instead of maintaining separate allowlists that can drift, `sessions_list` now follows the same status vocabulary the Gateway already emits.

The change is intentionally narrow. The PR says there are no configuration, environment-variable, storage, migration, dependency, compatibility, scheduling, or security changes. Production scope is actually smaller after the repair, because duplicate status handling was removed.

## Why Queued Status Matters

OpenClaw agents increasingly coordinate child sessions and background work. When a child run is admitted but waiting behind a concurrency limit, that is a real state the parent agent needs to understand.

Without `queued`, an agent might assume the child session has no active run and dispatch duplicate work, report the wrong status, or tell a user that nothing is happening. With the status preserved, agents can make a cleaner distinction between waiting, running, completed, and idle work.

The practical impact is simple:

- Queued child sessions now show `status: "queued"`.
- Agents can avoid duplicate dispatch while concurrency slots are full.
- User-facing progress reports can describe waiting work more accurately.
- The Gateway and agent-tool schemas stay aligned.

## Tested Against A Real Gateway Path

The proof used a real Gateway process, the real agent CLI, two agent turns, and a mock OpenAI-compatible provider. With `agents.defaults.maxConcurrent=1`, the first turn occupied the only slot while the second was admitted and queued. The first model response then invoked the real `sessions_list` tool.

Before the fix, the Gateway row showed `queued`, but the tool output showed the status as missing. After the fix, both showed `queued`.

Focused validation covered the Gateway protocol test suite, the sessions-list tool tests, formatting, Oxlint, changed-scope repository guards, exact-main and exact-head builds, and `git diff --check`.

For operators, this is not a flashy feature, but it removes ambiguity from multi-agent orchestration. OpenClaw already had the right state; now the agent-facing tool preserves it all the way to the model.
