---
title: "OpenClaw Crabbox Reuses Source Mirrors"
excerpt: "OpenClaw Crabbox can now reuse per-worktree source mirrors for repeated capsules, cutting repeated preparation work."
coverImage: '/assets/images/posts/openclaw-2026-9-26-crabbox-source-mirrors.png'
date: '2026-09-26T08:02:00.000Z'
dateFormatted: September 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-26-crabbox-source-mirrors.png'
---

OpenClaw merged a substantial Crabbox performance change just before the morning cutoff. [PR #158681](https://github.com/openclaw/openclaw/pull/158681), titled "perf(crabbox): reuse per-worktree source mirrors for capsules," targets a very specific pain point: repeated Blacksmith commands rebuilding and rehashing tens of thousands of source files before uploading a small local change.

The PR says the original clean-capsule preparation on a loaded Mac was still in `sync-plan` after more than 40 minutes before it was stopped. The new path reuses a private source mirror for the physical worktree when it is safe to do so.

## What Changed

The new cache is receipt-bound and SQLite-backed. It records source and destination identities plus raw blob IDs, while separate selection and transport indexes preserve the existing tracked-file privacy exceptions.

The operator-facing effect is that repeated commands can reuse unchanged source files. Changed or new source is still copied and hashed, and repository metadata is still scanned for eligibility and integrity.

The PR lists several important guardrails:

- A staging owner holds a nonblocking SQLite exclusive lock through command work, claim restoration, and artifact preservation.
- Contending calls can fall back to independent fresh capsules.
- Crash recovery does not automatically grant reuse authority; an explicit idle handoff is required.
- Cache corruption, witness or Git-version changes, and missing data rebuild cold.
- Git hooks and fsmonitor are disabled in the private mirror.
- Unknown ownership and unresolved dirty-source recovery remain protected.

The coordinator also requested a fixed 32-slot capacity increase. The PR keeps that as a hard limit rather than adding a new operator setting.

## Why It Matters

Crabbox sits in the path where OpenClaw prepares workspaces for isolated execution. When the repository is large, repeatedly creating clean capsules can dominate the cost of small test or proof commands.

The interesting part of this change is not simply "cache more." It is that reuse stays tied to receipts, observations, and verified idle state. That is the difference between a speedup that is convenient and one that can survive being part of a sandbox boundary.

The PR reports deterministic source-write comparisons: cold clean mirror preparation wrote 49,965 source files, while warm clean reuse wrote zero. A warm three-file change copied three source files, while a fresh capsule for the same change wrote 49,965.

## Evidence And Limits

The evidence includes warm/cold tree and bundle equivalence, focused capsule, wrapper, staging, claims, fsync, and location suites, plus later Testbox proof after the 32-slot capacity update. A focused remote run passed 429 tests with one platform skip.

The PR also gives a useful storage estimate: one retained mirror measured about 803.84 MiB on the Mac used for proof, so 32 retained slots would be about 25.12 GiB for that source size. That estimate excludes temporary fresh-capsule fallbacks and depends on repository size.

There is one caveat in the PR record: hosted CI for an earlier head failed on an unrelated lint issue outside the diff, and a later wrapper lint command reproduced an existing main error. The focused suites and changed gates cited for this PR passed.

## The Takeaway

PR #158681 should make repeated OpenClaw Crabbox commands much cheaper when the same worktree is reused. The implementation is deliberately conservative: it buys speed with receipts, locks, explicit idle handoff, and cold rebuilds when evidence goes stale.

That is the right shape for a performance improvement in a sandbox preparation path.
