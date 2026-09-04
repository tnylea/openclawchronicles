---
title: "OpenClaw Fixes SSH Cloud Session Cleanup"
excerpt: "OpenClaw can now finish SSH-backed cloud session cleanup after RPC admission credentials expire, without extending worker authority."
coverImage: '/assets/images/posts/openclaw-2026-9-4-ssh-cloud-cleanup.png'
date: '2026-09-04T23:20:00.000Z'
dateFormatted: September 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-4-ssh-cloud-cleanup.png'
---

OpenClaw has merged a Gateway cleanup fix for SSH-backed cloud sessions. [PR #138494](https://github.com/openclaw/openclaw/pull/138494), "fix: let SSH cloud sessions finish cleanup after RPC expiry," landed at 19:54 UTC on September 4, 2026.

The change addresses a lifecycle problem for cloud sessions that have been idle long enough for worker RPC admission credentials to expire. Before the fix, operators could be blocked from stopping, moving, or idle-suspending an SSH-backed cloud session even though the underlying SSH workspace connection and current owner were still valid.

## Why Expiry Was Too Broad

RPC admission expiry is still important. It controls whether a worker can be admitted through the RPC path, and the PR does not weaken that boundary.

The bug was that the same expiry check was being used too broadly for SSH workspace access. The PR explains that the SSH workspace transport uses a pinned SSH identity and does not forward the RPC token. Treating the expired RPC credential as a hard stop for workspace cleanup meant OpenClaw could strand an otherwise valid session at precisely the point where reconciliation needed to run.

That is a subtle but important ownership distinction: an expired RPC admission credential should not automatically invalidate an already-authenticated SSH cleanup path.

## What Changed

The fix removes the obsolete workspace-access gate tied to RPC credential expiry. OpenClaw still requires credential existence and revocation checks, owner epoch validation, lifecycle state, current build ownership, and pinned SSH authentication.

Worker RPC admission continues to enforce expiry. The SSH workspace cleanup path can now complete without renewing or extending RPC authority.

The PR also updates `docs/gateway/cloud-workers.md` and adds focused coverage around environment access, reclaim, move, idle-suspend, and admission behavior.

## User Impact

For operators, the practical result is less manual recovery around long-idle SSH cloud sessions:

- Stop operations can finish after an idle period.
- Move and reclaim paths are not blocked solely by expired RPC admission.
- Idle suspension can reconcile the workspace it still owns.
- Stale or revoked owners are still rejected.
- No configuration, storage, schema, or protocol change is introduced.

This brings SSH-backed workspaces closer to the separation already used by node-backed workspaces: transport ownership and worker admission are related, but not the same authorization decision.

## Evidence From The PR

The maintainers report that the access regression and three composed cleanup scenarios failed before the fix at the expiry check. Afterward, all 41 focused access, reclaim, move, idle-suspend, and admission tests passed.

The PR also includes live transport proof from Blacksmith Testbox run 33904957377. Both baseline and candidate executions used real SSH and rsync against an isolated loopback `sshd`, a real SQLite owner, a synthetic workspace, and an injected expiry clock. The baseline rejected workspace access after expiry. The candidate reconciled a remote file edit, kept the credential unchanged, rejected stale and revoked owner starts, and rejected the retained handle after Stop.

That evidence stops short of claiming a complete external-provider UI dispatch, but it directly covers the boundary that mattered: OpenClaw can finish SSH workspace cleanup after RPC expiry without extending the RPC credential itself.
