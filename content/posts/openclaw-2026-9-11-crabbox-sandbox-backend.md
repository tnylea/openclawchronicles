---
title: "OpenClaw Adds Crabbox Cloud Sandbox Backend"
excerpt: "OpenClaw now includes a Crabbox sandbox backend for cloud-hosted tool isolation, durable workspace leases, and repository-scoped cleanup."
coverImage: '/assets/images/posts/openclaw-2026-9-11-crabbox-sandbox-backend.png'
date: '2026-09-11T23:03:00.000Z'
dateFormatted: September 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-11-crabbox-sandbox-backend.png'
---

OpenClaw has gained a new cloud-hosted sandbox backend for tool-call isolation.

[PR #144454](https://github.com/openclaw/openclaw/pull/144454), titled `feat(crabbox): add a lease-backed sandbox backend for tool-call isolation`, merged on September 11th at 22:16 UTC. It lets users select Crabbox as an OpenClaw sandbox backend, with durable runtime IDs and repository-scoped management.

This is not just a provider toggle. Sandboxes need to survive interrupted provisioning, reuse the same remote workspace safely, and remain manageable after registry or plugin reopen. The PR builds that behavior into OpenClaw’s existing sandbox backend contract.

## What Changed

The Crabbox plugin now implements the sandbox backend contract. OpenClaw core reserves a durable runtime ID before provider allocation, serializes lifecycle changes, and retains uncertain or failed operations for recovery.

Shared reservations replay from the original provider workspace while each caller keeps its own workspace context. That distinction matters when sandboxes are reused across sessions or when ownership changes. A caller should not inherit the wrong local assumptions just because the remote lease is shared.

Static SSH and Crabbox now share remote-shell workspace, skills, execution staging, and filesystem implementation. Initial uploads publish the complete primary and agent workspace atomically, so partial transfers cannot be mistaken for completed workspaces. If two publishers race, the winning workspace and its later edits are preserved.

The PR also draws a hard line around credentials. Crabbox supplies a local `exec` command for each operation, and OpenClaw does not cache or execute raw provider SSH credentials.

## User Impact

Operators can set `agents.defaults.sandbox.backend` to `crabbox` and enable the bundled Crabbox plugin. Once configured, remote edits survive lease reuse and registry or plugin reopen. Recreate releases the old generation and creates a new one.

The expected behavior includes:

- Durable runtime IDs before provider allocation.
- Recovery for uncertain or failed lifecycle operations.
- Atomic initial workspace upload.
- Repository-scoped stop and cleanup.
- Rejection of unsupported command or provider capabilities before allocation.
- Runtime-generation fencing through actual process admission.

The initial supported route is direct Daytona. The PR notes that the released Crabbox 0.56.0 binary does not provide the complete contract. It requires a Crabbox build with claim-owned `exec`, offline `exec --check`, and `stop --current-repo`. Related Crabbox fixes landed in [openclaw/crabbox#2111](https://github.com/openclaw/crabbox/pull/2111) and [openclaw/crabbox#2119](https://github.com/openclaw/crabbox/pull/2119).

## Validation

The validation campaign includes real Daytona testing rather than only unit-level contract checks. One registered-plugin test passed in about 208 seconds and covered failed pre-submission recovery, concurrent creation, a shared caller from another repository, actual exec runtime, remote file operations, access after a 60-second token lifetime, registry and plugin reopen, recreate, and complete cleanup.

A deliberate ownership-transfer test moved a lease between two synthetic repositories after execution preparation and before spawn. The old repository’s prepared command, file access, and scoped cleanup were rejected. The new owner executed successfully and released the lease.

The PR also reports filesystem regressions for incomplete initial uploads, primary and agent retry, concurrent publication preserving user edits, and existing SSH workspace adoption. The final focused suite passed 190 tests across 13 files, covering core, plugin, SSH, remote-shell, and process-runtime behavior. A separate cleanup-token correction passed 95 focused tests, lint, assertion ratchet checks, and independent P0-P2 review.

## Boundaries

This merge does not publish Crabbox or change a live operator Gateway by itself. The live coverage described is Daytona on Linux from macOS, with registry and plugin lifecycle reopen. It does not claim a full Gateway process restart.

That boundary is useful. The OpenClaw side now has the backend and ownership model, while deployment depends on compatible Crabbox provider behavior.

## Why It Matters

Tool-call sandboxes are becoming part of the reliability and security story for agent systems. They are only useful if they isolate execution without losing work, leaking authority, or leaving remote resources impossible to clean up.

Crabbox gives OpenClaw another path for hosted isolation, but the important part is the contract around it: durable leases, atomic workspace publication, repository-scoped cleanup, and no raw provider credential caching. That is the difference between a sandbox that works in a demo and one that operators can reason about after failure.
