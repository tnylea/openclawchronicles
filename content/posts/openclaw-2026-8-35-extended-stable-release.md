---
title: "OpenClaw 2026.8.35 Adds Sol Model Support"
excerpt: "OpenClaw 2026.8.35 updates the extended-stable Gateway with GPT-6.1 Sol support, safer updates, and delivery reliability fixes."
coverImage: '/assets/images/posts/openclaw-2026-8-35-extended-stable-release.png'
date: '2026-10-02T23:00:00.000Z'
dateFormatted: October 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-35-extended-stable-release.png'
---

OpenClaw has published [v2026.8.35](https://github.com/openclaw/openclaw/releases/tag/v2026.8.35), a new Gateway-only `extended-stable` release for operators who prefer a conservative branch with current critical fixes. The release was published on October 2nd, after the morning Chronicle cutoff, and supersedes the previously tracked `v2026.8.34` extended-stable build.

The release notes describe this branch as OpenClaw from the end of August 2026 plus critical security updates, reliability and performance fixes, and newer model support. The latest regular release remains linked from the notes as `2026.9.7`, so this is not the fast-moving stable train. It is the lower-change branch for people who want August-era behavior with audited repairs backported.

## The Headline Changes

The largest visible addition is GPT-6.1 Sol support. The release says Sol was added across OpenAI routing, discovery, reasoning, harness, and Reef guard-model boundaries through PRs #161400 and #162955.

The rest of the release is a broad operational rollup. The notes group the changes around:

- Safer update and recovery behavior
- More reliable delegated and CLI agent completion
- Security and ownership hardening
- Channel and integration reliability
- Performance and UI continuity

The complete contribution record covers 49 in-range pull requests from `v2026.8.34` to `741d94f386d24b269cce748863ebd6c94d0e1b01`. That makes this a smaller release than the full current train, but still a serious backport package.

## Update Safety Gets More Attention

The update and recovery section is one of the most important parts of this release. OpenClaw says the branch now preserves incompatible-plugin settings through recovery, retains plugin records during migration, avoids pnpm terminal failures, and carries the existing Gateway lock through container and direct startup paths.

For operators, that means fewer surprises during maintenance. The point of an extended-stable branch is predictability, and update recovery is exactly where predictability matters most. A conservative branch that loses plugin inventory or stumbles over package-manager behavior is not actually conservative in practice.

The release also includes repair work around stale automatic tool snapshots while keeping explicit allowlists intact. That is a useful boundary: fix the broken snapshot, but do not broaden what an automation was allowed to do.

## Agent Delivery And Channels

OpenClaw 2026.8.35 also focuses heavily on completion delivery. The release notes call out uncapped cron reply recovery, complete CLI subagent answers, skipped-announcement handling, retained detached transcripts, suspended child-slot release, and failed-request steering behavior.

Those are not flashy features, but they shape whether OpenClaw feels dependable after a long delegated task or a scheduled job. The system has to preserve the final answer, return capacity to the pool, and avoid letting a failed request trample earlier questions.

Channel fixes are similarly practical. Gmail transient binds, IMAP backlog processing, Matrix direct mappings, Telegram progress, remote MCP bundles, and managed llama.cpp startup on clean Windows hosts all receive attention in the release.

## Verification Signals

The release includes a detailed verification section. It links the npm package at `openclaw@2026.8.35`, the registry tarball, integrity hash, release SHA, npm preflight, full validation workflow, plugin publication, Docker publication recovery, and a manual finalization note.

That last note says the owner approved finalization after independent verification of npm signatures and provenance, the `extended-stable` selector, all 89 plugin packages, Docker digests and attestations, requested upgrade paths, live model and channel paths, and public container smoke.

For a Gateway-only extended-stable release, that is the right emphasis. The story is less about a single new interface and more about proving that the conservative branch still has current operational footing.

## Why This Release Matters

OpenClaw is now serving two different operator needs. The regular train can keep moving quickly, while the extended-stable branch can absorb specific model, security, reliability, and integration fixes without pulling every current change forward.

Version `2026.8.35` is worth attention because it adds current model compatibility and a wide set of repair work to that quieter branch. If you run OpenClaw in a setting where update stability matters more than immediate access to every latest feature, this is the release to review.
