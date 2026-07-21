---
title: "OpenClaw Brings Branch Switching To Native Apps"
excerpt: "OpenClaw native apps now gain safer session branch switching with branch-aware outboxes across macOS, iOS, and Android."
coverImage: '/assets/images/posts/openclaw-2026-7-21-native-branch-switching.png'
date: '2026-07-21T23:02:00.000Z'
dateFormatted: July 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-21-native-branch-switching.png'
---

OpenClaw's native chat apps caught up with one of the Control UI's more advanced conversation controls today: transcript branch switching. Two merged PRs, [#112056](https://github.com/openclaw/openclaw/pull/112056) for macOS and iOS and [#112284](https://github.com/openclaw/openclaw/pull/112284) for Android, bring branch menus, rewind and fork behavior, and branch-aware durable outboxes to the native surfaces.

This is the kind of feature that matters most after a long session gets complicated. If a user rewinds a conversation, forks from a message, or switches between transcript branches, the app needs to keep pending sends aligned with the branch the user actually intended.

Before these patches, the web Control UI had branch-switching lineage, but native apps could not see or switch branches in the same way. Worse, durable outboxes were branch-unaware, so an offline or queued message could replay onto the wrong branch after a rewind, fork, or cross-client switch.

## What Changed

On macOS and iOS, the composer now gains a branch menu that lists session branches with message counts and timestamps. It refreshes lazily when opened and switches branches through the `sessions.branches.list` and `sessions.branches.switch` protocol methods.

The durable outbox now stamps queued rows with a branch epoch. When a confirmed branch change happens, OpenClaw bumps the epoch and parks stale rows instead of blindly flushing them. Delivery callbacks are attempt-versioned, so callbacks from superseded attempts become no-ops.

Android follows the same contract and adds chat bubble actions for Rewind and Fork. Its Room-backed outbox also carries epoch-scoped branch ownership, local flush checks, branch mutation leases, and revision checks to reject stale transcript-tip writes.

## Why It Matters

Native chat apps have harder delivery conditions than a single live browser tab. Phones go offline. Apps restart. Multiple windows can share cached state. A message can be queued, delayed, retried, or delivered after a session mutation.

Branch-aware delivery coordination prevents confusing outcomes where a reply intended for one branch lands somewhere else. The PRs add guardrails around several risky moments:

- Switching, rewinding, and forking are gated while runs, sends, aborts, or pending outbox work are active.
- Stale branch-mutation leases demote to a reconciliation state rather than allowing unsafe sends.
- Parked rows that may already have reached the Gateway retry with a fresh delivery identity.
- Remote branch changes feed back into native session state.

The accepted tradeoffs are still honest. The Swift PR notes that a cross-client switch racing a send's arrival can still land on the newly active branch because the protocol does not yet carry an `expectedActiveLeaf` precondition. The Android PR similarly notes that a fork with unknown outcome can duplicate if the user explicitly retries because the RPC has no idempotency token yet.

## Proof From The PRs

The Apple-side PR reports 157 Swift Testing cases across seven suites, covering switch, rewind, fork gating, epoch parking, restart replay validation, cache migrations, connection-generation reconciliation, lease expiry, and stale callback handling.

The Android PR reports 1,820 Android unit tests, clean `ktlintCheck`, clean Android i18n checks, and adversarial review cycles covering echo correlation, revision CAS, reconcile retry lanes, and ambiguity recovery.

Together, these changes make transcript branching feel less like a web-only power feature and more like a native OpenClaw session primitive.
