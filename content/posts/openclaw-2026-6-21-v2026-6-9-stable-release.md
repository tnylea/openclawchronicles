---
title: "OpenClaw 2026.6.9 Ships Stable Agent Recovery"
excerpt: "OpenClaw 2026.6.9 is now stable with richer Telegram delivery, stronger recovery paths, Codex integration upgrades, and provider plugins."
coverImage: '/assets/images/posts/openclaw-2026-6-21-v2026-6-9-stable-release.png'
date: '2026-06-21T08:00:00.000Z'
dateFormatted: June 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-21-v2026-6-9-stable-release.png'
---

OpenClaw's weekend release train reached stable this morning with [OpenClaw 2026.6.9](https://github.com/openclaw/openclaw/releases/tag/v2026.6.9), published at 01:44 UTC on June 21. The release promotes the work first seen in the 2026.6.9 beta, then adds more Telegram delivery fixes and a verified stable package.

The headline is operational maturity. This is not a single-feature release; it is a broad hardening pass across channel delivery, agent recovery, Codex integration, official provider packaging, client surfaces, search, and ClawHub provenance.

## What Shipped

The official notes put Telegram first. OpenClaw now sends richer HTML, preserves rich markdown and sticker paths, renders progress drafts and command output more faithfully, normalizes HTML tables safely, and keeps mentions and spooled handlers on the intended delivery path.

That matters because Telegram is one of OpenClaw's most demanding surfaces. A chat agent that can send long structured output, progress updates, tables, media, stickers, and command results has many ways to lose fidelity. This release closes several of those small but user-visible gaps.

Agent recovery is the second major thread. The release calls out retries, terminal outcomes, usage after compaction, session history repair, and reply reconciliation. In practical terms, interrupted or partial turns should more reliably move toward a visible final result instead of leaving users with a silent stall or incomplete transcript.

## Codex And Providers

OpenClaw 2026.6.9 also gives Codex a stronger runtime bridge. The release includes automatic plugin approvals, GPT-5.3 Spark OAuth routing, remote-node `exec` as a dynamic tool, and more reliable app-server teardown and terminal outcomes.

Provider packaging took a bigger step too. The release notes say official provider plugins are now standalone npm releases, externally installed channel plugins load at Gateway startup, and StepFun is available from npm and ClawHub. That points toward a cleaner ecosystem boundary: core OpenClaw can move quickly while provider and channel packages become first-class installable pieces.

The search and skill story is also stronger. Codex Hosted Search is available, key-free search providers remain deliberate opt-ins, and ClawHub skill installs retain verified source provenance.

## Verification Details

The release includes the kind of evidence operators care about:

- npm package: `openclaw@2026.6.9`
- registry tarball integrity: `sha512-y0PGUdE87S8QtQXABPDL0CjNKhH3q/R1h9/WiRQkhVCGSBVhs63/M1iZn2DYVyJCAbDyMz3KNyAE0WzSQIWCRg==`
- release SHA: `c645ec4555c017931de0e35ad9847dffae2741ef`
- full release CI and validation reports linked from the GitHub release
- Windows Hub promotion from `openclaw/openclaw-windows-node@v0.6.3`

The notes also state that the audited contribution record covers the full `v2026.6.8..HEAD` history, spanning 422 merged PRs. That is a big release window, and the grouped changelog is doing useful editorial work by separating user-impact themes from the complete PR inventory.

## Why It Matters

The stable release is a good snapshot of where OpenClaw is heading: less brittle chat delivery, more recoverable agent execution, stronger plugin boundaries, and more verifiable releases.

For users, the practical upgrade story is simple. If you rely on Telegram, Codex, external providers, ClawHub installs, or long-running agent sessions, 2026.6.9 is a meaningful stable update rather than just a version bump.
