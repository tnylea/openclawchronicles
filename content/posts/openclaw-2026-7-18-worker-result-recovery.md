---
title: "OpenClaw Preserves Cloud Worker Results After Crashes"
excerpt: "OpenClaw now stages cloud-worker file results inside the Gateway before applying them, preventing lost work after worker or Gateway failures."
coverImage: '/assets/images/posts/openclaw-2026-7-18-worker-result-recovery.png'
date: '2026-07-18T23:03:00.000Z'
dateFormatted: July 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-18-worker-result-recovery.png'
---

OpenClaw's cloud-worker recovery path is getting a durability upgrade. [PR #110952](https://github.com/openclaw/openclaw/pull/110952), `fix: cloud-worker results are lost when the box dies before reconciliation`, merged at 22:24 UTC on July 18.

The change addresses the data-loss half of issue #110224: a finished cloud-worker turn could lose its file result if reconciliation failed and the worker environment disappeared before OpenClaw accepted the workspace changes.

## What Went Wrong

Before this merge, a cloud-worker result lived on the leased worker box until the Gateway could cleanly apply it to the local session workspace. That worked for the happy path, but it left a dangerous gap.

If inbound reconciliation hit local divergence and the worker box then died, OpenClaw could no longer retrieve the unaccepted result. The recovery sweep could find the environment gone, force-fail the placement, and permanently lose the turn's work.

The PR says this was observed during a live cloud-workers stress test.

## The New Recovery Path

OpenClaw now stages the complete worker result tree as a durable Git ref in the session workspace repository before attempting to apply it. The canonical ref lives under `refs/openclaw/worker-results/<claim>`, with a crash-safe candidate ref used while it is being constructed.

Once that staged ref exists, retries no longer depend on the worker tunnel. Apply and recovery can run locally from the staged tree. A Gateway restart can preserve the pending result instead of abandoning it just because the remote worker environment is gone.

The state database also receives an additive schema update with a nullable `staged_result_ref` column on the pending-result fence row.

## What Stays Out Of Scope

The PR is deliberately narrow. It does not try to solve conflict resolution policy, turn-claim release semantics, chat error copy, or new UI affordances. Those are called out as later phases for issue #110224.

That restraint matters because the core guarantee here is simple: once the worker has produced a result and the Gateway has pulled it, the result should survive worker loss and Gateway restart.

## Evidence

The PR reports 447 focused tests passing across worker-environment code and state database coverage. Tests cover staging order, crash-gap adoption of canonical refs, dead-environment recovery from the staged ref without a tunnel, divergence keeping the fence and placement alive, ref cleanup on accept, hostile git-hook neutralization, and the state schema migration.

It also includes real recovery proof through an isolated Gateway, bundled Crabbox provider, AWS worker path, deterministic QA provider, SSH and tunnel setup, durable staging, lease loss, Gateway restart, and recovery. The reported SHA-256 of the worker result matched before and after restart, pending rows dropped to zero, the placement was reclaimed, and the staged Git ref was cleaned up.

## Operator Takeaway

Cloud-worker output is now treated as Gateway-owned durable state before reconciliation. A dead worker can still interrupt a workflow, but it should no longer erase completed file changes that had already been pulled back.
