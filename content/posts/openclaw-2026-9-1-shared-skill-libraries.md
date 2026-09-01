---
title: "OpenClaw Adds Shared Skill Libraries"
excerpt: "OpenClaw shared Gateway teams can now own, share, pin, and read complete reusable skill libraries without requiring host access."
coverImage: '/assets/images/posts/openclaw-2026-9-1-shared-skill-libraries.png'
date: '2026-09-01T23:04:00.000Z'
dateFormatted: September 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-1-shared-skill-libraries.png'
---

OpenClaw merged a major skills feature today: [PR #134068](https://github.com/openclaw/openclaw/pull/134068), `feat(skills): add personal libraries for shared Gateways`. The feature gives shared-Gateway teammates a way to own complete reusable skill libraries without direct host access, while sessions pin immutable revisions so later edits or sharing changes cannot silently replace the selected skill.

This is a big architectural move for teams using OpenClaw as a shared agent platform. Skills are no longer only local files or host-managed resources. They become profile-owned library artifacts with sharing, revision pinning, bounded reads, editor support, CLI support, and Gateway/node-worker proof.

## What Changes

The merged PR says libraries belong to authenticated profiles. Explicit sharing grants discovery and use without edit access, and administrator transfer preserves identity and authorship. Solo administrators keep the existing workspace workflow.

The feature uses existing OpenClaw surfaces rather than introducing a completely separate toolchain:

- Skills UI.
- CLI skill commands.
- Skill Workshop.
- Existing execution transports.
- Gateway and node-worker materialization.

Bundles can preserve supporting text, binary bytes, and executable flags. Attach, detach, and refresh take effect at the next safe turn, which keeps live sessions from silently changing under an agent mid-run.

## Why Revision Pinning Matters

Skill libraries are powerful because they can guide agents, expose workflows, and carry supporting files. In a shared Gateway, that power also creates a trust problem: a teammate may select a skill, but the owner may later edit, replace, or unshare it.

OpenClaw addresses that by pinning sessions to immutable revisions. A later edit can produce a new revision, but it cannot invisibly replace what an existing session selected. That gives shared teams a more auditable boundary between discovery, selection, and execution.

The PR states that callable capabilities remain in private host grant state. Requests retain the exact admission through body parsing, tool execution, and publication. This is still one trusted Gateway domain, not hostile-tenant isolation, but it is a stronger ownership model for ordinary shared work.

## Safety Repairs Included

The PR also updated `fs-safe` to exact `0.7.0` and fixed several defects found during integration. OpenClaw now creates an identity-owned temporary directory before a filesystem producer runs, then uses the canonical root move and unchanged sibling publisher. Existing destination bytes, modes, atomic replacement, and path checks remain intact.

Another repair covers consumed media streams. A final-rename failure could previously replay an exhausted stream and report a successful zero-byte save. The stream owner now allows directory recreation only before iteration starts, while buffers keep replayable recovery.

The Swift client also received a generated-type repair after adding a skills session key exposed a structural-schema collision. The PR reports that all 857 serialized protocol schemas are byte-identical before and after that fix.

## Proof From The Merge

The merge commit is `75bcd267f5e72086fa5361e263b0f6cb1248adc6`, from validated source head `93fbd9f4488f9c332b2d54f07580841a1b468da8`. The PR reports exact-head CI passed, final runtime build passed, 49 health/inventory tests passed, and 27 installer tests passed.

The evidence also includes real Gateway and node-worker scenarios. A synthetic two-profile flow proved allowed shared-session pinning, denied private or unpinned access, helper execution from node-owned materialization, owner denial, refresh, removal, cancellation, replacement, and reclaim. A live Gateway/CLI run covered 17 public CLI operations with two authenticated synthetic profiles.

The PR is careful about limits. It does not claim hostile-tenant isolation, live cloud provisioning, or a zero-profile/merged-profile UI fixture. It also names a post-merge follow-up: one profile could monopolize the global pending ZIP-upload pool, which was later tracked separately.

## Operator Takeaway

OpenClaw shared skill libraries make reusable skills more team-friendly. Profile ownership, explicit sharing, immutable revision pins, and bounded artifact reads give operators a stronger story for using Skills and Skill Workshop on a shared Gateway without handing every teammate host-level access.
