---
title: "OpenClaw Keeps ACP Global Sessions Agent-Safe"
excerpt: "OpenClaw ACP sessions now preserve the selected agent through global keys, controls, reset, cleanup, and Control UI handoffs."
coverImage: '/assets/images/posts/openclaw-2026-8-31-acp-global-session-owners.png'
date: '2026-08-31T23:04:00.000Z'
dateFormatted: August 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-31-acp-global-session-owners.png'
---

OpenClaw merged a large ACP ownership repair tonight in [PR #134314](https://github.com/openclaw/openclaw/pull/134314), titled `fix(acp): keep the selected agent through global session operations`. The change fixes a class of failures where host ACP sessions could lose their selected agent when a session used `global`, another bare key, or an agent-qualified main alias that resolved to `global`.

That matters because ACP sessions sit at a sensitive boundary between OpenClaw's session model and an external harness. Lookup, controls, resume, reset, cleanup, and native commands all need to keep the OpenClaw owner distinct from the backend resource being controlled.

## The Failure Mode

The PR describes a case where users operating host ACP sessions could lose the selected agent through global-session operations. Real isolated Control UI verification also exposed a native `agent` RPC failure after successful Main and Work global chat turns. The request was accepted, but failed before provider execution with a placement mismatch.

Two adjacent handoffs also dropped the supplied owner during subscription and session description paths. The result was not just a naming bug. It was a session-ownership bug across manager state, actor queues, runtime caches, backend controls, and UI projections.

## The Repair

OpenClaw now carries one resolved owner/key pair through the ACP manager, queue, runtime cache, active turns, callers, and backend controls. ACPX maps bare logical keys to owner-scoped backend resources while preserving qualified-key behavior and physical one-shot record IDs.

The PR adds an `ownerAwareSessions: 1` backend capability so older backends cannot silently share bare resources. Existing qualified-key backends remain supported.

Doctor also gets an offline migration path for existing records. It uses existing storage and maintenance authority, preserves raw history and event references, handles interrupted publication, and leaves ambiguous, live, conflicting, or unclaimed records intact with diagnostics.

## User Impact

The practical outcome is straightforward: two OpenClaw agents can operate ACP sessions with the same bare logical key while keeping histories, controls, and resets independent. Native global-session operations keep the same storage and placement identity as chat. Qualified aliases retain their owner through subscriptions and session descriptions.

Operators with existing bare ACPX histories may need to stop the Gateway, run `openclaw doctor --fix`, and restart. The repair is conservative: records without sufficient ownership evidence are left in place with an actionable diagnostic instead of being silently rewritten.

## Evidence

The merged PR reports extensive proof. The final contract integration passed 475 tests across 20 files, followed by 22 reset tests. Native placement repair passed 289 focused tests, and the complete Gateway file passed seven isolated-Gateway cases while adding ten native owner turns.

ACPX process coverage used the public manager, real canonical metadata, ACPX 0.13.1, and a synthetic stdio peer for initialization, independent history, restart, controls, cancellation, reset, and generated helper targeting. Exact-head Linux CI passed with 203 successful jobs, 12 skipped jobs, and no failures or pending jobs.

## Why It Matters

OpenClaw is steadily adding more ways for agents, workers, and external control protocols to share infrastructure. That only works if a common key like `global` does not erase the difference between owners.

This PR is a strong ownership-boundary fix. It does not add a new schema version or a new operator setting. It teaches the existing ACP stack to keep the selected agent attached all the way through lookup, command routing, lifecycle repair, UI subscription, and cleanup.
