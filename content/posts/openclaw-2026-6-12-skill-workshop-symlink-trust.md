---
title: "OpenClaw Tightens Skill Workshop Symlink Trust"
excerpt: "OpenClaw now separates trusted skill symlink reads from Skill Workshop writes, closing a subtle apply-time boundary for shared skill directories."
coverImage: '/assets/images/posts/openclaw-2026-6-12-skill-workshop-symlink-trust.png'
date: '2026-06-12T00:10:00.000Z'
dateFormatted: June 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-12-skill-workshop-symlink-trust.png'
---

OpenClaw's Skill Workshop gained a tighter write boundary today for workspaces that load skills through symlinks.

The change landed in [PR #91311](https://github.com/openclaw/openclaw/pull/91311), titled "Allow Skill Workshop apply through trusted skill symlinks." The headline sounds permissive, but the design is intentionally conservative: OpenClaw now separates trust for reading skills from trust for writing skill proposal results.

That distinction matters for shared skill directories, managed workspaces, and setups where `workspace/skills` points somewhere outside the main OpenClaw workspace.

## Read Trust Is Not Write Trust

The PR keeps trusted symlink target configuration in `skills.load.allowSymlinkTargets`. That setting controls whether OpenClaw can load skills through approved symlink destinations.

Writing through Skill Workshop is now governed by a separate switch: `skills.workshop.allowSymlinkTargetWrites`. The PR describes it as default-false. In practice, that means a target can be trusted for loading and proposal creation without automatically becoming a place where Skill Workshop can apply file changes.

That is the right split. Reading a skill file and writing a new `SKILL.md` or support file are different operations with different risk profiles.

## What The Resolver Checks

The implementation threads active config into CLI, Gateway, and agent-tool apply paths. It also validates both `SKILL.md` and proposal support-file writes or removals through the same symlink write-target resolver.

The real behavior proof in the PR walks through four important cases:

- No allowlist: proposal apply is blocked as an untrusted symlink target.
- Read allowlist only: proposal creation can work, but apply is blocked.
- Read allowlist plus Workshop write switch: apply succeeds through the trusted target.
- Tampered support-file target: apply is blocked before writing.

That last case is especially important. Support files are easy to overlook in security reviews because they feel secondary to `SKILL.md`, but they are still files written under the authority of the Workshop apply step.

## Why Operators Should Care

Skill Workshop is becoming one of OpenClaw's durable customization surfaces. It lets agents propose reusable instructions, workflows, and support files instead of leaving every bit of procedure trapped in a chat transcript.

As that surface grows, filesystem boundaries matter more. A symlinked skill directory may be a deliberate shared library. It may also be a path where writes should require extra operator intent.

This PR gives operators that intent boundary. You can allow OpenClaw to read from a trusted skill target without allowing agent-mediated Workshop applies to write there. When you do want that write path, there is now an explicit config switch for it.

## The Bigger Pattern

OpenClaw's recent releases have been full of boundary work: channel payload filtering, tool-call guards, owner-only HTTP tools, sandbox defaults, and now Workshop symlink write separation.

PR #91311 fits that pattern. It does not make Skill Workshop less useful. It makes the write path more explicit, which is the kind of quiet hardening that matters when agents are allowed to edit durable local files.

Read the full proof and configuration details in [OpenClaw PR #91311](https://github.com/openclaw/openclaw/pull/91311).
