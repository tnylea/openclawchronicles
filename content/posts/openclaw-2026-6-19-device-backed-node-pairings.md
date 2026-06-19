---
title: "OpenClaw Fixes Device-Backed Node Removal"
excerpt: "OpenClaw now removes device-backed node pairings durably, closing a Gateway authorization gap for Android and phone-backed nodes."
coverImage: '/assets/images/posts/openclaw-2026-6-19-device-backed-node-pairings.png'
date: '2026-06-19T23:25:00.000Z'
dateFormatted: June 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-19-device-backed-node-pairings.png'
---

OpenClaw merged a Gateway authorization fix late Friday: PR [#90373](https://github.com/openclaw/openclaw/pull/90373) removes device-backed node pairings durably when users call `node.pair.remove`.

The bug was subtle but important. The pull request says `node.list` can surface Android or phone nodes backed by `devices/paired.json`, while `node.pair.remove` previously removed only legacy records in `nodes/paired.json`. That meant a visible node could remain authorized and reappear after a user thought it had been removed.

## What Changed

The fix removes the effective `node` role from the canonical paired-device store. For node-only device rows, OpenClaw deletes the row. For mixed-role devices, it preserves unrelated roles and tokens while removing the node capability.

The PR also clears matching pending repair requests and any legacy node pairing. That dual cleanup matters because OpenClaw has both legacy node pairing records and newer device-backed records in play.

The result is a more accurate removal model: if a device-backed node appears in `node.list`, removing it through `node.pair.remove` should actually remove its node authorization instead of only deleting one older record format.

## Authorization And Disconnect Ordering

The PR applies the same device-management authorization policy as `device.pair.remove`. It also places `node.pair.remove` behind the post-connect credential-mutation barrier.

That barrier is meaningful because credential mutation is security-sensitive. A connected node should not be able to pipeline another privileged request after its node role has been revoked. The PR says node-role clients are invalidated before the success response and disconnected after it.

That ordering gives clients a clean response while still closing the credential window promptly.

## Auditable Without Raw Secrets

OpenClaw also emits trusted security events for allowed and denied node-role removal. The pull request says those events are redacted and use hashed device identifiers with `role: node`, not raw device IDs or tokens.

That is the right shape for operational audit logs. Operators need to know that a node role was removed or denied. They do not need raw credentials or stable device identifiers leaking into diagnostic streams.

## Why This Matters

OpenClaw's node system is expanding beyond simple local pairings. Android and phone-backed nodes make remote and mobile execution more useful, but they also increase the number of credential stores and lifecycle paths the Gateway must manage.

If removal only works for one store, users can end up with stale authorization:

- A node disappears from one record but returns through another.
- Operators believe a device was removed when it still has a node role.
- Mixed-role devices are hard to clean up without breaking unrelated operator access.
- Security logs cannot clearly explain what happened.

PR [#90373](https://github.com/openclaw/openclaw/pull/90373) addresses those cases directly.

## Verification

The PR includes focused tests across Gateway node and device methods, WebSocket post-connect health, and both device and node pairing infrastructure.

Its proof section says 211 focused tests passed locally and an AWS Crabbox run passed 226 exact-worktree tests on Linux. Disk readback proved node-only rows disappear from `devices/paired.json`, merged rows disappear from both stores, and mixed-role rows retain only the operator role and token.

The handler assertions also verify the important ordering: invalidation before response, disconnect after response.

## The Bottom Line

OpenClaw PR [#90373](https://github.com/openclaw/openclaw/pull/90373) is a security and operations fix for anyone pairing remote nodes through device-backed paths.

It closes the gap between what `node.list` shows and what `node.pair.remove` actually revokes, while preserving mixed-role devices and keeping audit events privacy-safe. For Gateway operators, that makes node lifecycle management much less surprising.
