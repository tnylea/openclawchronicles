---
title: "OpenClaw Keeps Concurrent Node Turns Connected"
excerpt: "OpenClaw PR 164087 preserves node pairing authority during capacity updates, keeping concurrent node-hosted turns available."
coverImage: '/assets/images/posts/openclaw-2026-10-3-concurrent-node-turns.png'
date: '2026-10-03T08:15:00.000Z'
dateFormatted: October 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-3-concurrent-node-turns.png'
---

OpenClaw merged [PR #164087](https://github.com/openclaw/openclaw/pull/164087), a P1 fix for concurrent node-hosted sessions. The short version: ordinary worker-capacity updates should no longer make another active node turn look disconnected from its supervisor.

For users running paired nodes, this is the kind of bug that feels random. One session is doing useful work, another publishes capacity or host metadata, and a node-hosted turn can fail reconciliation or stall. The PR describes the visible failure as a node worker not being connected with the supervisor dialect, even though the underlying issue is a metadata publication path rather than an intentional pairing revocation.

## The Pairing Problem

OpenClaw's node pairing system has to be conservative. Revocation, approval, failed reads, epoch checks, and precommit ownership checks must remain strict, because pairing authority is the boundary that decides whether a node is allowed to keep doing work.

The bug was that pairing publication blocked every connected node while any pairing-store mutation was pending. Runner inventory writes session-host metadata on capacity updates, so normal concurrent turns could temporarily appear disconnected while unrelated metadata changed.

The fix is intentionally narrow. The pairing owner now preserves usable authority only for three metadata operations that cannot change pairing identity or generation. The rest of the fences stay in place.

## Why This Matters

Node-hosted OpenClaw setups are valuable because they let work move closer to the machine, workspace, or tool environment that should execute it. But that also means they need boring reliability under concurrency. Capacity updates and host-stat publication should be routine background facts, not events that strand a live session.

The PR says no node configuration, stored-pairing migration, or protocol change is required. Updating the Gateway is enough.

## Evidence From Live Runs

The validation is stronger than a synthetic unit-only proof. The PR reports a live AWS test with one isolated Gateway and two loopback node hosts. Before the fix, one of four concurrent turns failed, and another had a long tail of 28,878 ms. After the fix, 12 of 12 turns across four sessions completed with ordered transcripts and no missing or duplicate inputs.

The deterministic regression also focuses on the exact authority distinction. It fails on the original production code for the metadata operations in question, while controls for token revocation and already-failed publication pass before and after. That is a good sign: the change repairs the concurrency failure without blurring actual revocation behavior.

## Limits Are Clear

The PR does not claim that node turns are now faster than local Gateway turns, and the sample warm-turn table is careful about that. In the measured run, node tails remained higher than local Gateway tails. The repair is about correctness and availability: keep concurrent node turns connected while harmless metadata updates pass through.

The extended soak coverage is also useful context. It covered multi-turn node sessions with file tools, cancellation, queueing and steering, node host kill recovery, Gateway kill recovery, idle expiry, edit conflicts, and node-to-Gateway-to-node continuity. One Codex remote exec path remained unavailable because the test nodes did not advertise the required plugin command, and the PR records that limitation instead of overclaiming.

For node operators, [PR #164087](https://github.com/openclaw/openclaw/pull/164087) is worth prioritizing if you run concurrent sessions or rely on paired nodes for active work. The expected behavior after updating is simple: capacity, host statistics, and skill-bin metadata can update while existing node turns keep their pairing authority.
