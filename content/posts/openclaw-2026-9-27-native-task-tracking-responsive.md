---
title: "OpenClaw Keeps Native Codex Tasks Responsive"
excerpt: "OpenClaw PR #159325 moves native Codex task persistence off the Gateway event loop, keeping subagent tracking responsive under SQLite contention."
coverImage: '/assets/images/posts/openclaw-2026-9-27-native-task-tracking-responsive.png'
date: '2026-09-27T08:00:00.000Z'
dateFormatted: September 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-27-native-task-tracking-responsive.png'
---

OpenClaw merged a high-priority Codex reliability fix just before the September 27 morning cutoff. [PR #159325](https://github.com/openclaw/openclaw/pull/159325), titled `fix(codex): keep native task tracking responsive during database contention`, targets a sharp operational problem: native Codex subagent tracking could contend for the task database hard enough to stall Gateway work.

The pull request summarizes the core issue as Gateway event-loop stalls when native Codex subagent tracking contends for the task database. That matters because task creation, progress updates, cleanup, parent rotation, and completion custody are all part of the machinery that makes native Codex work feel reliable rather than mysterious.

## What Changed

The patch moves native task persistence through the existing worker-backed task runtime. Instead of doing task database work in a way that can freeze unrelated Gateway activity, accepted persistence is ordered through a finite queue. Cleanup also joins that work, while the detached completion owner continues to handle later result delivery.

For users, the headline is straightforward: native task creation, progress, and cleanup can wait for persistence without freezing other Gateway work.

The PR also keeps important ownership boundaries intact:

- Original task assignments stay fenced across overlapping notifications.
- Follow-up turns and parent rotation keep their custody guarantees.
- Session retirement still preserves the expected cleanup path.
- Native admission checks required capabilities before claiming a child.
- Legacy custom task adapters remain usable for ordinary parent registration.

## Why It Matters

OpenClaw's Codex integration has been getting more native runtime support, but that also raises the standard for persistence and recovery behavior. If subagent tracking blocks the Gateway event loop, the symptom can look larger than the original contention: unrelated work may feel stuck, task progress can appear stale, and completion delivery gets harder to reason about.

This fix is especially relevant for busy installations that rely on native Codex subagents. Database contention is not exotic in those systems; it can happen during overlapping task starts, completion receipts, follow-up discovery, or cleanup. The new worker-backed path makes that contention explicit and ordered instead of letting it leak into Gateway responsiveness.

## Proof From The Merge

The PR includes direct regression coverage for the behavior it changes. The maintainers tested registered notification handlers with the real SDK, worker, and SQLite database under a held write lock. According to the merge notes, creation, activity, terminal failure, and retirement stayed responsive with zero main-thread SQL calls.

The final proof was broad: the PR reports 531 passing cases across registered SQLite, native handler, history, admission, cleanup, and client-lifetime runs. The final-head CI passed on commit `20b8e30a`, and the change merged as `dcb903a1830e`.

## The Bottom Line

This is not a flashy UI change, but it is the sort of reliability work that makes OpenClaw feel calmer in real use. Native Codex task tracking now has a more disciplined persistence path, and the Gateway is less likely to pause unrelated work just because task state is busy.
