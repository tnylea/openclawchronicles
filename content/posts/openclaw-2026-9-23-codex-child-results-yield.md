---
title: "OpenClaw Fixes Codex Child Results After Parent Yield"
excerpt: "OpenClaw now preserves native Codex child completion authority after a parent yields, preventing lost results during handoff or Gateway restart."
coverImage: '/assets/images/posts/openclaw-2026-9-23-codex-child-results-yield.png'
date: '2026-09-23T08:01:00.000Z'
dateFormatted: September 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-23-codex-child-results-yield.png'
---

OpenClaw's native Codex integration picked up a significant reliability repair this morning. [PR #156247](https://github.com/openclaw/openclaw/pull/156247), "fix(codex): deliver native child results after parent yields," landed as a P1 change with compatibility risk labels and detailed Gateway proof.

The bug was subtle but painful: native Codex child work could finish after its parent yielded, while the completion callback still relied on the expired authority of the admitting turn. When that happened, results could fail to persist or resume the requester. The pull request also notes a related problem where a thread-scoped wait snapshot could overwrite a newer assignment for the same child.

In plain terms, delegated Codex work needed a custody model that survived the exact handoff path it was designed to use.

## The Repair

The merged change gives accepted native child work the authority needed to record its result and resume the same requester after the parent turn has yielded. Revoked or replaced requesters remain blocked, so this is not a blanket resume permission.

The implementation introduces completion custody for accepted assignments and separates requester continuation from Gateway execution ownership. Events and transitions carry an immutable task receipt, and only an acknowledged commit can advance that receipt. Execution holds are released after terminal persistence and the first handoff, which keeps retry delivery from holding a Gateway restart open indefinitely.

Custom detached adapters also get a clearer contract. They must implement the optional `transitionTaskAssignment` operation before accepting native exact-assignment work. Registration now checks the captured adapter, including reused runtimes, and raises an upgrade error before submitting a turn if the adapter cannot satisfy the contract.

## Why Builders Should Care

This is the kind of reliability work that makes multi-agent delegation feel boring in the best way. Parent turns yield. Gateways restart. Children finish late. A durable agent runtime has to preserve the right authority across those transitions without accidentally delivering results to the wrong requester.

The PR specifically calls out three classes of repair:

- Native child completions after parent yield.
- Gateway restart drain during completion delivery.
- Successor assignment protection when wait snapshots are stale.

Those are not glamorous features, but they define whether larger Codex workflows can safely fan out work and collect the answer later.

## Verification

The evidence is unusually thorough. The PR reports a real Linux deployment where a native child completed 14 seconds after its parent yielded, a distinct parent turn resumed, the result was returned, and the task recorded as delivered. Later observation found additional delivered native tasks without new authority or persistence errors.

The final candidate also passed Gateway authority cases, 378 sibling tests across 12 files, Copilot attempt coverage, core and plugin type graphs, SDK surface checks, architecture checks, and packaged build proof. Storage compatibility was explicitly checked: canonical schema SQL files, schema-version declarations, task readers and writers, and receipt helpers were unchanged.

For OpenClaw users, the result is straightforward. Native Codex delegation should no longer drop child results simply because the parent yielded or the Gateway was draining through restart recovery.
