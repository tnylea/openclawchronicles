---
title: "OpenClaw Preserves CLI Continuity for Queued Turns"
excerpt: "OpenClaw now preserves native CLI conversation continuity when queued turns resume through a fresh process or fallback candidate."
coverImage: '/assets/images/posts/openclaw-2026-9-2-cli-continuity-queued-turns.png'
date: '2026-09-02T23:00:00.000Z'
dateFormatted: September 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-2-cli-continuity-queued-turns.png'
---

OpenClaw's queued CLI sessions got a P1 continuity fix today. PR [#136644](https://github.com/openclaw/openclaw/pull/136644), merged on September 2, repairs a case where a queued turn could lose native conversation continuity when it resumed through a fresh CLI process.

That sounds narrow, but it sits in a sensitive part of the agent runtime. If a user queues a follow-up while a CLI-backed session is still busy, the next turn needs to resume the same native conversation. Otherwise, the agent can behave as if the earlier native context is gone, even though the OpenClaw session itself still looks continuous.

## What Changed

The PR describes the core bug as follows: users queueing another turn on a CLI-backed session could lose native conversation continuity when the next turn started in a fresh CLI process. It also fixes a second failure mode where a retired or rejected run could overwrite the continuation that a later turn should use.

The repair moves native continuation settlement before the same-session admission lane releases. Command, reply, and cron flows now share that ownership rule. Only the explicit native binding result is persisted, while local OpenClaw session IDs remain separate from native CLI IDs.

The change also tightens who is allowed to publish continuity:

- Accepted fallback candidates may publish a binding
- Explicit invalid-binding cleanup still works while the exact owner is live
- Closed, replaced, or rejected owners cannot publish or clear a later continuation
- Cron stages the result until its guarded base commit succeeds

That last point matters for automation. Cron work often runs without a human watching every intermediate state, so late finalization must not resurrect a rejected write after ownership has moved on.

## Why It Matters

OpenClaw increasingly treats native CLIs as durable runtime surfaces rather than one-off command wrappers. Users expect a queued turn to carry the same context whether the original CLI process is still warm or a new one starts cold.

Without this fix, the visible session could look like one continuous conversation while the native backend had quietly split continuity. That is exactly the kind of mismatch that makes long-running work unpredictable: follow-ups can lose grounding, fallback paths can appear flaky, and rejected candidates can contaminate later state.

PR #136644 makes the persistence rule more explicit: only the live, accepted owner gets to record or clear the continuation.

## Verification

The PR reports a green exact-head CI run for commit `c4102b45bdc5f43704e4af8987503f7e46550b6c`. Changed checks, type checks, lint, dead-code scans, runtime and UI builds, and a refreshed before/after Gateway fallback proof all passed.

The regression proof is useful because it reproduced the bug against a real outer-fallback path. On the old build, a queued cold command received no native binding and a Gateway/Control UI direct `agent` RPC probe returned `FALLBACK_COLD_RESUME_MISSING`. On the fixed build, the queued turn retained the accepted native conversation binding.

This is a runtime plumbing fix, but it has a user-facing result: queued CLI-backed work should continue the conversation it belongs to, even after process boundaries shift underneath it.

---

*PR [#136644](https://github.com/openclaw/openclaw/pull/136644) · merged September 2, 2026 · source: OpenClaw GitHub*
