---
title: "OpenClaw Moves Security Stores Into SQLite"
excerpt: "OpenClaw moved exec approvals and auth profiles into SQLite, replacing fragile JSON stores with doctor-gated migrations and fail-closed recovery."
coverImage: '/assets/images/posts/openclaw-2026-7-26-sqlite-security-stores.png'
date: '2026-07-26T23:00:00.000Z'
dateFormatted: July 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-26-sqlite-security-stores.png'
---

OpenClaw's database-first migration picked up two important security-state wins on July 26. [PR #114063](https://github.com/openclaw/openclaw/pull/114063) moved exec approvals into the shared SQLite state database, while [PR #114033](https://github.com/openclaw/openclaw/pull/114033) completed the SQLite-only cutover for auth profiles.

Both changes follow the same theme: sensitive policy and credential routing state should live behind the same transactional storage, migration receipts, and doctor repair flow as the rest of OpenClaw's shared runtime state.

## Exec Approvals Leave JSON Behind

Exec approvals previously lived in `~/.openclaw/exec-approvals.json`, guarded by a sidecar lock file and several stale-lock heuristics. That was workable, but brittle. The PR notes that lock contention could fabricate a deny policy on otherwise permissive hosts, because failed acquisition degraded to fail-closed behavior.

The new owner is the reserved `exec_approvals_config` singleton row in `state/openclaw.sqlite`. Reads and writes use SQLite transactions, the existing RPC and web UI compare-and-swap contract is preserved, and socket path/token storage moves into the row without changing the socket itself.

The important operator behavior is explicit:

- Fresh installs need no migration.
- Upgrades with legacy JSON must run `openclaw doctor --fix`.
- Until Doctor runs, exec-approval-dependent surfaces fail closed with a direct migration instruction.
- Malformed legacy bytes are preserved for operator recovery instead of being imported as a fallback policy.

That is a better failure shape than silently accepting an empty or synthetic approval document.

## Auth Profiles Finish The Same Cutover

The auth profile change removes steady-state runtime reads from legacy files such as `auth-profiles.json`, `auth-state.json`, `auth.json`, and shared `credentials/oauth.json`.

Doctor now owns a locked, idempotent migration for those sources. It verifies SQLite targets before archival, resumes interrupted archive finalization, and preserves original credential bytes in timestamped archives. After that, runtime auth paths use SQLite only.

For plugin developers, the modern SDK surface is now `AuthStorage.forAgent(agentDir)`. Two older path-taking APIs remain available as SQLite-backed deprecations during a documented compatibility window, but existing deprecated files fail closed rather than being read as live credential state.

## Why This Matters

These are not flashy features, but they sit directly under the trust boundary. Exec approvals decide whether an agent can run commands. Auth profiles decide which credentials a session can reach. Moving both away from ad hoc JSON stores gives OpenClaw a more consistent upgrade, audit, backup, and repair story.

The two PRs also continue a pattern that has been showing up across recent OpenClaw releases: when a legacy state file becomes a security boundary, the project is preferring a doctor-gated migration over a quiet compatibility reader. That can make upgrades more explicit, but it also avoids ambiguous runtime behavior while credential and approval state is in transition.

## Verification

PR #114063 reports focused coverage for the SQLite exec-approval store, Doctor migration, snapshot sanitizer, Gateway RPC, node-host RPC, CLI, extensions policy checks, Swift runtime, database-first guards, and native schema checks.

PR #114033 reports 511 focused tests across Doctor receipts, SQLite store probes, secrets audit and apply paths, session auth storage, gateway config, stale Doctor repairs, and QA Lab, plus a packaged upgrade survivor from `openclaw@2026.7.1` to the candidate `2026.7.2`.

For operators, the takeaway is clear: the next OpenClaw upgrade may ask Doctor to finish moving old security files, but the resulting runtime has fewer file locks, fewer implicit fallbacks, and more observable fail-closed behavior.
