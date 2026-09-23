---
title: "OpenClaw Cancels Guest Work After Access Revocation"
excerpt: "OpenClaw now cancels Guest exec and private sandbox work when the original access is revoked, tightening Docker and Podman cleanup boundaries."
coverImage: '/assets/images/posts/openclaw-2026-9-23-guest-work-access-revocation.png'
date: '2026-09-23T08:00:00.000Z'
dateFormatted: September 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-23-guest-work-access-revocation.png'
---

OpenClaw merged a P0 security-sensitive fix this morning that tightens what happens when Guest access is revoked while work is still running. The change landed in [PR #156106](https://github.com/openclaw/openclaw/pull/156106), titled "fix: cancel Guest work when its original access is revoked."

The core issue was lifetime mismatch. A Guest command could be admitted while access was valid, then keep running after the original source that authorized it was gone. The pull request says the builtin exec path previously retained only a startup guard, while sandbox lifetime was disconnected from access after foreground work ended.

For agent systems, that boundary matters. Revocation should not be a polite hint. If an invited Guest loses the authority that made a command legal, OpenClaw now keeps enough source information to cancel the exact managed run and join backend cleanup before releasing custody.

## What Changed

The fix covers both registered exec work and private sandbox environments. Registered exec now retains its original source through process finalization, cancels the exact managed run, and joins targeted process cleanup. Independently authorized work in a shared environment is intended to continue.

Docker and Podman containers created under one original invitation and profile also stop when that retained access ends. The PR is careful about the edge cases:

- Multiple connections for the same invitation remain private.
- Losing one device does not revoke another valid source.
- Saved workspace files and writable container layers survive.
- Different invitations, staff access, preexisting containers, and explicit shared scope are excluded from whole-container cleanup.

That last point is important. This is not a broad "kill anything nearby" policy. OpenClaw tracks the immutable container ID selected during admission and uses the existing allocation lock, registry field, and SQLite worker to bind source retention, setup, reuse, replacement, and removal.

## Why It Matters

Guest access is one of the sharpest edges in a personal-agent system because it blends collaboration with local execution. If the user revokes access, the system has to distinguish between work that was authorized by that Guest source and work that happens to share an environment.

The new behavior narrows that gap. It gives OpenClaw a stronger answer for invited collaborators, temporary access, and managed sandboxes: when access ends, private Guest work loses its authority too.

The implementation also avoids pretending that a canceled local Docker client proves the in-container payload is gone. The evidence section describes process identity and pidfd checks, strict terminated-state inspection, and cleanup custody when a stop is failed or uncertain.

## Verification

The PR reports physical proof on isolated Linux with Docker 28, plus unit coverage for Podman target binding and dispatch. In one scenario, revoking registered Guest work killed the targeted process while an independent process in the same shared container stayed alive and completed successfully.

The final head passed affected tests and integrated Gateway wait, asynchronous transcript persistence, failure-report, requester-wake cancellation, cancellation rollback, registry, reservation, and attachment cases. The PR also notes final hosted review was Diamond-rated with no findings.

For operators, there is no new schema, configuration option, or migration called out in the change. The practical takeaway is simpler: Guest execution cleanup now follows the authority that admitted the work, rather than trusting startup checks alone.
