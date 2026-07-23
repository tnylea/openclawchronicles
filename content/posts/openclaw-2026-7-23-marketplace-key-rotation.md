---
title: "OpenClaw Fixes Trusted Feed Key Rotation"
excerpt: "OpenClaw repaired trusted marketplace feed key rotation, preserving rollback checks while accepting newly valid signed feed updates."
coverImage: '/assets/images/posts/openclaw-2026-7-23-marketplace-key-rotation.png'
date: '2026-07-23T23:02:00.000Z'
dateFormatted: July 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-23-marketplace-key-rotation.png'
---

OpenClaw merged a focused marketplace trust fix in [PR #108342](https://github.com/openclaw/openclaw/pull/108342), allowing trusted hosted-feed signing keys to rotate without breaking valid feed updates.

The bug sat in a sensitive part of the supply chain. A newly valid, higher-sequence hosted feed could be rejected after the configured signing key changed because OpenClaw tried to reverify the old snapshot under the new key before comparing rollback metadata. The durable proof also found that SQLite persisted accepted monotonic metadata but dropped it when reconstructing a signed snapshot.

## The Key Rotation Problem

Trusted feeds need two properties at the same time:

- New live feeds must verify under the currently configured trust set.
- Already accepted signed snapshots need enough authenticated sequence metadata to prevent rollback.

Before this fix, those two requirements collided during routine key rotation. If the old retained snapshot did not verify under the new key, OpenClaw could reject a newer feed even when that newer feed was correctly signed by the rotated key.

That is not just an inconvenience. Hosted marketplace feeds are part of how operators receive plugin and catalog metadata. A rotation path that blocks valid updates can delay compatibility fixes, security metadata, or trusted catalog changes.

## What Changed

The PR changes the comparison model. OpenClaw now compares newly verified signed feeds against persisted accepted monotonic metadata, instead of requiring the old snapshot to reverify under the new key simply to participate in rollback comparison.

It also restores accepted monotonic metadata when signed snapshots are loaded from SQLite. Persisted signed snapshots can therefore carry rollback authority from the authenticated body, while unsigned rows cannot acquire that authority.

The patch preserves the fail-closed behavior when the old snapshot does not satisfy the current trust policy. It also keeps the existing policy from PR #110037: live feeds require standard DSSE, while persisted beta snapshots remain readable where that policy allows them.

## Proof Scenario

The regression test exercises the production hosted-catalog loader and the real SQLite snapshot store with deterministic guarded network responses. It accepts sequence 8 signed by a generated Q2 key, reopens the persisted snapshot, rotates trust to Q3, and accepts sequence 9. It then rotates to Q4 and rejects sequence 7 as a rollback while retaining the accepted sequence 9 snapshot.

The observed result after the fix is exactly the desired behavior: sequence 9 is accepted under the rotated key, sequence 7 fails closed, and the retained sequence 9 snapshot remains readable under its accepted policy.

## Why Operators Should Watch It

Marketplace trust is one of OpenClaw's most important security boundaries. Key rotation must be boring. If ordinary rotation causes catalogs to stall, operators may be tempted to clear state, disable checks, or force updates. If rollback checks become too loose, attackers get a path to older signed metadata.

This patch threads that needle. It supports ordinary hosted-feed key rotation while preserving monotonic rollback protection.

The maintainer decision in the PR is explicit: accepted signed-feed monotonic metadata may remain rollback-authoritative across routine configured-key rotation, while every newly fetched feed must verify under the current trust set. Emergency key compromise remains a separate operator recovery path that clears or rebuilds local hosted-feed snapshot state.

## Validation

The PR reports a Windows checkout using Node 24.15.0 and SQLite 3.51.3, generated Ed25519 key pairs, the production loader, durable SQLite storage, a full hosted catalog suite with 50 passing tests, formatting and lint checks, `git diff --check`, and a final Codex review with no actionable correctness issues.

For teams relying on trusted plugin feeds, this is the kind of maintenance patch that keeps the update pipeline both available and strict.
