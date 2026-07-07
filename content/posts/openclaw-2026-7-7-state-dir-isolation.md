---
title: "OpenClaw Tightens State Directory Isolation"
excerpt: "OpenClaw now skips app-group identity migration when OPENCLAW_STATE_DIR is set, protecting relocated stores and local tests."
coverImage: '/assets/images/posts/openclaw-2026-7-7-state-dir-isolation.png'
date: '2026-07-07T23:20:00.000Z'
dateFormatted: July 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-7-state-dir-isolation.png'
---

OpenClaw merged [PR #101779, "fix(shared): skip app-group identity migration when OPENCLAW_STATE_DIR is overridden"](https://github.com/openclaw/openclaw/pull/101779), a P1 state-isolation fix for Mac app and shared OpenClawKit flows.

The immediate symptom was local test failure on Macs that had previously paired the OpenClaw app. The deeper issue was more important: a fresh overridden state directory could silently import real app-group device identity and auth tokens from the machine's normal OpenClaw store.

## What Changed

OpenClaw's shared device identity path logic now treats an explicit `OPENCLAW_STATE_DIR` override as a hard boundary. When that environment variable is set, app-group migration returns no source and does not import the machine's real paired identity into the override directory.

Default store selection remains unchanged. The fix applies to relocated or test stores that explicitly opt into a different state directory.

The PR also updates the test isolation trait so gated tests pin `OPENCLAW_STATE_DIR` to a fresh temp directory, then restore either the launch value or a run-scoped quarantine directory afterward. That prevents late writes from reconnect tasks from falling back into a developer's real store.

## Why It Matters

State directory overrides are used in tests, development, relocated installs, and isolated operator setups. Those directories are expected to be separate from the user's real app identity.

If a supposedly fresh directory imports a real `device.json` or `device-auth.json`, two bad things can happen:

- Tests become non-deterministic because they see a developer's real pairing state.
- Test literals or local experiments can overwrite or contaminate real device auth state.

The PR body says the old behavior could clobber a real node token with a test literal. That is exactly the kind of boundary bug that is easy to miss because clean CI machines pass while local, paired machines fail.

## Operator Impact

For normal users, default app behavior should not change. OpenClaw still uses the normal container or legacy store path when no override is set.

For developers and operators using explicit state directories, the behavior is now more predictable. A relocated store should start as the relocated store, not as a copy of whatever identity happened to live in the app-group container.

## Test Cleanup

The PR also removes repeated hand-written `setenv`/restore blocks from a dozen tests and moves that responsibility into `StateDirectoryIsolationTrait`. That is less exciting than the production fix, but it matters for keeping the boundary consistent.

When isolation lives in one trait, future tests are less likely to forget the cleanup step or accidentally leave the process pointed at a real user store.

## Validation

The PR reports a before/after reproduction on a Mac with real pairing state. Before the fix, two `GatewayNodeSessionTests` loaded the machine's real tokens. After the fix, the targeted OpenClawKit test set passed 44 of 44 tests on the same polluted Mac.

It also reports a broader package run with 600 tests across 55 suites green except one unrelated existing reconnect-timeout flake, plus byte checks confirming real machine stores kept only real tokens and no test literals.

## Bottom Line

OpenClaw now respects `OPENCLAW_STATE_DIR` as an isolation boundary. That is a quiet but important hardening step for local development, test reliability, and any setup that deliberately keeps state outside the default app store.
