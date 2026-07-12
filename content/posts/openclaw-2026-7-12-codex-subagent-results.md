---
title: "OpenClaw Preserves Codex Subagent Results"
excerpt: "OpenClaw improves Codex native subagent recovery so child results survive parent cleanup, resumptions, and app-server transport races."
coverImage: '/assets/images/posts/openclaw-2026-7-12-codex-subagent-results.png'
date: '2026-07-12T08:01:00.000Z'
dateFormatted: July 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-12-codex-subagent-results.png'
---

OpenClaw merged a P1 Codex runtime fix Sunday morning that makes native subagent completions more durable after parent cleanup, transport changes, resumptions, and delivery failures.

The pull request, `fix(codex): preserve native subagent results after parent cleanup`, is a reliability story for delegated work. When a parent run launches native Codex subagents, the parent may clean up its app-server client before every child result has been recovered. Before this change, that could lose child output, prefer stale local rollout data, or rerun a parent indefinitely when final delivery could never become durable.

Source: [OpenClaw PR #102060](https://github.com/openclaw/openclaw/pull/102060)

## App Server History Becomes Canonical

The core shift is that OpenClaw now treats the Codex app server's `thread/read` and `thread/turns/list` responses as the canonical recovery state. Streamed terminal messages remain the fast path, but recovery no longer depends on brittle local rollout-file discovery or transcript parsing.

That matters because Codex can run across transports that are not just local stdio. The PR notes that the old local-rollout recovery path could not cover non-stdio app-server transports. It also had to juggle transcript parsing, whole-client rescans, and deferred cleanup behavior.

The new monitor keeps the shared physical client alive only while detached children still need monitoring, fences stale reads across lifecycle changes, and keeps interrupted children resumable.

## Fewer Infinite Recovery Loops

One particularly practical fix is bounded terminal delivery retry behavior. If parent delivery is permanently non-durable, OpenClaw now records a durable failed state after retry exhaustion instead of waking the parent forever.

For operators, that is the difference between a clear failure and background churn. A failed delivery can be inspected and handled. An endlessly reawakened parent can make the system look busy while never actually making progress.

## Why Operators Should Care

Native subagents are only useful if their work returns reliably. A delegated code review, investigation, or long-running child task can be expensive in both time and model cost. Losing the final child result after parent cleanup turns parallelism into uncertainty.

This fix improves several failure modes at once:

- Child results survive parent app-server cleanup.
- Resumed children are protected from stale local rollout state.
- Websocket and non-local transports get a recovery path.
- Permanently failed parent delivery stops after bounded retries.
- App-server history replaces ad hoc rollout and transcript recovery.

## Verification

The PR cites exact Codex 0.142.5 app-server protocol and source checks around thread lineage, status transitions, live turn history, and unloaded `turn/completed` items. Focused tests passed across native subagent monitoring, task mirrors, run-attempt thread cleanup, and shared-client behavior. The broader Codex extension suite also passed with 2,008 tests across 96 files.

This is not a flashy UI feature, but it is the kind of reliability work that makes subagents feel like dependable infrastructure instead of a clever best-effort layer.
