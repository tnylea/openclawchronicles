---
title: "OpenClaw Backports Undici Security Fix"
excerpt: "OpenClaw backported the patched Undici dependency into the 2026.6.35 candidate, closing a release gate blocker while preserving local DNS pinning safely."
coverImage: '/assets/images/posts/openclaw-2026-9-7-undici-security-backport.png'
date: '2026-09-07T23:05:00.000Z'
dateFormatted: September 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-7-undici-security-backport.png'
---

OpenClaw has merged a dependency security backport for the extended-stable 2026.6.35 candidate. [PR #141583](https://github.com/openclaw/openclaw/pull/141583), "fix(deps): backport Undici security update for 2026.6.35," landed on September 7, 2026 at 22:49 UTC.

The patch carries a reviewed Undici repair from main into the candidate branch. According to the PR, release validation was blocked because the candidate still resolved production Undici 8.9.0 while the upstream advisory covered versions 8.0.0 through 8.10.1.

The updated candidate moves its Undici 8.x importers to 8.10.2 and the remaining jsdom edge to 7.29.1.

## What Changed

The headline change is a targeted dependency update. OpenClaw's candidate-owned Undici importers move from 8.9.0 to 8.10.2, while shrinkwrap and lockfile records are refreshed so release validation can verify the exact dependency graph.

The PR also keeps the candidate's local proxy and DNS behavior intact. That matters because Undici's trailing-dot matcher changed, and OpenClaw still needs strict local DNS pinning for `NO_PROXY` hosts.

This is not a broad release-tool rewrite. The PR says main-only release-tool and plugin manifests were intentionally not recreated in the candidate. The backport is scoped to the vulnerable dependency family, the related lock updates, temporary security-cooldown exceptions, and the proxy/DNS contract needed by the newer dispatcher.

## Why It Matters

Dependency security work is often invisible until it blocks a release. Here, the practical issue was straightforward: the 2026.6.35 candidate could not pass its npm artifact dependency gate while it still resolved a vulnerable Undici version.

Undici sits in a sensitive part of the stack because it handles HTTP client behavior. The PR notes that the patched version preserves function-valued `connect` and `tls` options outside a JSON clone instead of silently dropping custom TLS verification.

For OpenClaw users on extended-stable tracks, the important signal is that security maintenance is being carried backward into release candidates rather than only moving forward on main.

## User Impact

There is no new user-facing setting in this change. The intended outcome is safer release packaging for the 2026.6.35 candidate and preserved behavior for OpenClaw's proxy environment handling.

The files touched include the browser extension package, Discord and Telegram shrinkwraps, root package metadata, workspace lockfiles, `docs/tools/web-fetch.md`, and proxy environment tests.

Teams that care about extended-stable candidates should treat this as release hygiene with a security edge: the candidate dependency graph now points at patched Undici versions while keeping OpenClaw's local-network safeguards in place.

## Validation

The PR reports that the vulnerability gate went from one hard blocker to zero hard blockers after the update across 1,355 resolved versions. It also lists lockfile-only install, frozen-lockfile install, shrinkwrap checks, dependency change reporting, and docs listing as completed.

Focused proxy tests passed with 62 cases, including coverage for the patched proxy behavior. The final dependency report changed one package family, moving Undici 7.29.0/8.9.0 to 7.29.1/8.10.2 without adding or removing packages.

For operators, that is the useful takeaway: OpenClaw's 2026.6.35 candidate now carries the reviewed Undici security repair, and the backport keeps the surrounding network contracts explicit.
