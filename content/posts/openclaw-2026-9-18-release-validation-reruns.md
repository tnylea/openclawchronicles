---
title: "OpenClaw Release Validation Keeps Reruns Moving"
excerpt: "OpenClaw PR #151469 lets release validation recover its original publication plan after child retries remove older GitHub artifacts."
coverImage: '/assets/images/posts/openclaw-2026-9-18-release-validation-reruns.png'
date: '2026-09-18T08:04:00.000Z'
dateFormatted: September 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-18-release-validation-reruns.png'
---

OpenClaw merged [PR #151469](https://github.com/openclaw/openclaw/pull/151469), a release-infrastructure fix for Full Release Validation parent workflows that need to continue after a child retry succeeds.

The issue was specific but painful: `pnpm frv continue --failed` could fail during parent admission after GitHub removed the original plan artifact on a full parent rerun. The exact plan cache survived, but admission still required the missing artifact before it could restore that cache.

## What Changed

The new release-validation flow records the plan digest in the original successful guarded upload's job log. During continuation, the admission owner authenticates the exact original parent, workflow, successful admission, sealer, upload, and digest witness before accepting cached plan bytes.

In plainer terms: the cache can supply the bytes, but the original trusted producer still supplies the identity.

That distinction is important. A cache-only shortcut would make release recovery easier, but weaker. This PR keeps provenance checks in place while adding a way to recover when GitHub artifact availability changes during reruns.

## Why It Matters

Release automation is one of the least forgiving parts of an agent platform. A product bug can often be patched with a follow-up release. A publication bug can strand a release train, confuse evidence, or make operators distrust the artifact they are being asked to install.

PR #151469 is designed for that failure class. New Full Release Validation parents can restore their original publication admission and immutable plan on later attempts, adopt the same child runs, and collect a final manifest. The PR says admission time, registry observations, observation artifact descriptors, candidate identity, and selected coverage stay unchanged.

That is the right shape: continue the same validated release story instead of silently inventing a new one.

## What Is Not Being Bypassed

The PR is careful about limits. Historical registry-admitted workflows without the restore contract are refused before child or parent reruns. The notes also state that an updated controller cannot retrofit frozen workflow code.

That refusal is not a bug. It is the safety boundary. Release infrastructure should be able to say, "this old workflow did not record enough evidence for the new recovery path," and stop before it mutates anything.

The validation notes are extensive: 693 tests passed across release-validation components, four focused workflow and contract tests passed, actionlint and repository guards passed, and exact-head CI passed. A post-merge proof-broker run also passed on the landed commit.

## The Operator Takeaway

Most OpenClaw users will never invoke Full Release Validation directly. They will feel this kind of work indirectly through cleaner releases and fewer stalled publication attempts.

For maintainers and downstream operators, the takeaway is sharper: OpenClaw is continuing to harden the machinery that proves what got built, which workflow admitted it, which artifacts survived, and which rerun path is allowed to proceed.

That may not show up as a new button in the UI, but it is part of the trust model around every installable build.
