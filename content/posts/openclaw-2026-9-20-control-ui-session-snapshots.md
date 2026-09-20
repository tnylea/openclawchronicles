---
title: "OpenClaw Cuts Control UI Session Reloads"
excerpt: "OpenClaw PR #152510 reuses subagent-tree session snapshots so active child sessions update without repeated full roster reloads."
coverImage: '/assets/images/posts/openclaw-2026-9-20-control-ui-session-snapshots.png'
date: '2026-09-20T08:02:00.000Z'
dateFormatted: September 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-20-control-ui-session-snapshots.png'
---

OpenClaw's Control UI picked up a targeted performance fix in [PR #152510](https://github.com/openclaw/openclaw/pull/152510): active sessions inside subagent trees can now update without repeatedly reloading the full session window.

The PR is framed as a behavior-only performance change. Rendering, templates, styles, configuration, and permissions are unchanged. The point is to reduce unnecessary `sessions.list` traffic while preserving the same visible session facts.

## The problem

After an earlier optimization, the Control UI could still reload its session window when active sessions belonged to subagent trees. The PR cites deployed Gateway evidence showing about six `sessions.list` requests per second across 49 connected viewers.

That is not catastrophic on its own, but it is exactly the sort of background pressure that makes busy control surfaces feel heavier over time. The evidence also mentions a roughly 37 ms median list request over 2,300 rows and 0.27 main-thread seconds per second spent handling lists.

## What changed

The resident projection now resolves affected ancestry once per publication. That includes navigation, control, requester, and collector ancestry. The per-connection presenter adds refreshed `ancestorSessions` to both `sessions.changed` and `session.message`, using the same visibility filter and row presentation as `sessions.list`.

The traversal is deliberately bounded. It deduplicates physical identities, handles cycles, and omits incomplete bundles or bundles beyond 64 ancestors. In those unsafe cases, clients keep the authoritative refresh fallback.

The shared UI reconciler also applies held rows with their own identities, clocks, and field receipts. It clears omitted authoritative facts and avoids redundant parent-description reads. Activity-summary-only events now bypass agent-roster refreshes, matching the main session roster's existing policy.

## Why it matters

OpenClaw's multi-agent story depends on the Control UI staying calm even when child sessions, collectors, requesters, and parent relationships are active. If every child update forces broad session-window reads, the UI pays a tax precisely when the system is doing the most interesting work.

This change keeps the authoritative list path for initial loading and unsafe cases, but avoids using it as the default reaction to every tree update. Initial loading remains three enriched 100-row pages because a single 300-row request would lose titles and previews after row 100.

## Validation notes

The PR includes a clear before-and-after fixture:

- Before implementation, the team reproduced missing Gateway ancestor payloads, stale UI ancestor facts, and 336 list RPCs for each four-event child, terminal-child, and recap-only phase across 28 viewers.
- After the change, the same fixture recorded zero list RPCs in all three phases after initial loading.
- Initial loading remained 84 RPCs, and broad archive, group, cleanup, and catalog-change invalidations retained their existing coalesced refresh behavior.
- Final local validation covered 1,176 session and agent-roster UI tests across 70 files, plus 59 Gateway tests.

The exact-head CI run linked from the PR passed, and both required `openclaw/ci-gate` checks reported success.

For users, the visible result should be less needless roster churn when watching active subagent work in the Control UI. For operators, it is another small but meaningful step toward making large, busy OpenClaw sessions feel routine.

