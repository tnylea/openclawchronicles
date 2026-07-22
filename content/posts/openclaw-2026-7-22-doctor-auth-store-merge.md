---
title: "OpenClaw Doctor Fix Preserves Auth Stores"
excerpt: "OpenClaw's latest doctor fix prevents legacy auth repairs from deleting SQLite-only credentials during routine maintenance runs."
coverImage: '/assets/images/posts/openclaw-2026-7-22-doctor-auth-store-merge.png'
date: '2026-07-22T23:00:00.000Z'
dateFormatted: July 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-22-doctor-auth-store-merge.png'
---

OpenClaw merged a focused but important auth-store repair in [PR #98245](https://github.com/openclaw/openclaw/pull/98245), closing a P1 maintenance hazard in the default `openclaw doctor` path. The issue was not a remote exploit. It was more mundane, and in practice more painful: a routine doctor repair could wipe provider credentials that existed only in the newer SQLite auth profile store.

The pull request describes the failure mode plainly: running `openclaw doctor` could "silently and permanently destroy stored auth credentials" when an old flat `auth-profiles.json` lived beside a populated SQLite credential store. For operators who had migrated over time, that meant a stale legacy file could overwrite newer OAuth or API credentials during a maintenance run.

## What Changed

The bug sat in the legacy flat-auth repair path. Before the fix, the repair routine built a store from the old JSON file and saved it wholesale. That made sense when the JSON file was the only store. After the SQLite migration, wholesale replacement became dangerous because the SQLite row could contain credentials the old file had never known about.

The new behavior mirrors the sibling SQLite migration path:

- Load the existing SQLite auth profile store first.
- Merge imported legacy flat profiles into that store.
- Let existing SQLite credentials win when there is overlap.
- Verify imported profiles are present before removing the flat file.
- Leave the flat file in place and warn if verification fails.

That last point matters. The repair now treats verification failure as a reason to preserve recovery material, not as an excuse to remove the legacy file anyway.

## Why Operators Should Care

Most OpenClaw users do not think about credential storage until something breaks. OAuth refresh tokens, API keys, and provider profiles are supposed to be boring infrastructure. The risk in this bug was that a normal cleanup command could turn into a re-authentication incident, especially on long-lived installs that had crossed multiple storage formats.

The PR gives a concrete example: a SQLite store with an Anthropic OAuth credential could be replaced by a flat file containing only an OpenAI API key. The OpenAI key survived, but the Anthropic refresh token disappeared. Because the backup captured only the flat JSON, the SQLite-only credential was not recoverable from the repair backup.

After the patch, the same repair preserves the Anthropic OAuth credential and imports the OpenAI key beside it.

## Evidence From the Merge

The author tested the real repair function against a real on-disk per-agent SQLite auth store plus a real legacy flat `auth-profiles.json`. On pristine `main`, the SQLite-only OAuth credential vanished after doctor ran. With the patch, both credentials remained.

The focused regression suite also passed: `doctor-auth-flat-profiles.test.ts` reported 28 passing tests, and the new case fails on pristine `main` while passing with the fix. The PR also records clean lint, formatting, and core typecheck lanes.

This is a good example of why migration code deserves the same scrutiny as runtime auth code. The credentials were not exposed through a network boundary, but they could still be destroyed by an overly eager maintenance path.

## The Bigger Pattern

OpenClaw has been steadily moving operational state into structured stores, and that is the right direction. But the transition period is where sharp edges appear: old files remain on disk, doctor tries to help, and a repair written for yesterday's storage model runs against today's mixed state.

PR #98245 narrows that risk. For operators, the practical takeaway is simple: `openclaw doctor` should now be safer on older installs that still carry flat auth profile files. For maintainers, the lesson is broader: every legacy repair should merge, verify, and preserve recovery material before it deletes anything.
