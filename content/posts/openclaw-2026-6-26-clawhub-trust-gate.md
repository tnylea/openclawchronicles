---
title: "OpenClaw Adds a ClawHub Trust Gate"
excerpt: "OpenClaw now checks ClawHub trust metadata before installing or updating community plugins and skills from the marketplace."
coverImage: '/assets/images/posts/openclaw-2026-6-26-clawhub-trust-gate.png'
date: '2026-06-26T23:03:00.000Z'
dateFormatted: June 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-26-clawhub-trust-gate.png'
---

OpenClaw merged [PR #81364, "Check ClawHub trust before plugin and skill installs"](https://github.com/openclaw/openclaw/pull/81364), a P1 security-boundary change for marketplace installs and updates.

The change is aimed at a simple but high-impact question: before OpenClaw downloads and runs a community plugin or skill from ClawHub, does ClawHub already know that release is blocked, malicious, suspicious, official, or clean?

Until this patch, install and update flows could rely too heavily on local checks after resolution. Now OpenClaw asks for ClawHub trust state before the archive is fetched, and the result changes what the CLI, gateway, and chat surfaces are allowed to do next.

## What Changed

The new trust gate applies to community ClawHub plugins and archive-backed skills. Malicious or quarantined releases are blocked before download. Suspicious releases require an explicit acknowledgement before installation or update can proceed.

The PR also adds a clean bypass path for sources that should not be treated like unknown community packages:

- Official ClawHub plugin releases can install or update without ClawHub risk prompts.
- Official ClawHub skill publishers can be recognized through publisher metadata such as `owner.official`.
- Bundled OpenClaw plugins and skills use the first-party source path.
- Operator-owned `security.installPolicy` still runs for official and bundled sources.

That last point is important. The change does not make official sources invisible to local policy. It removes marketplace-risk friction where the source is first-party or verified, while preserving local administrative controls.

## Why It Matters

OpenClaw skills and plugins are powerful because they can teach agents new workflows and connect them to real systems. That also makes distribution trust a core product surface.

This merge gives OpenClaw a more explicit answer for risky marketplace content. A blocked community release stops before download. A suspicious release becomes a visible operator decision. Clean releases continue normally. Official and bundled sources avoid unnecessary prompts, but still pass through local policy.

The practical result is a stronger install boundary without turning every marketplace action into the same warning dialog.

## Better Errors for Chat and Control

PR #81364 also updates gateway protocol handling so chat and control surfaces can receive structured ClawHub trust errors. That means clients can distinguish a blocked or suspicious marketplace release from a generic install failure.

That distinction matters for operator experience. A generic failure encourages retries. A structured trust failure tells the user that OpenClaw intentionally refused the install path or is waiting for explicit risk acknowledgement.

## Validation

The PR includes screenshot proof for plugin installs, skill installs, plugin updates, and skill updates across malicious, suspicious, clean, official, and source-linked cases.

Automated coverage included focused ClawHub trust tests, install and update CLI tests, gateway schema tests, docs checks, TypeScript checks, oxlint, and `git diff --check`. The PR body notes that full `pnpm check` and Crabbox/Testbox were not rerun in that checkout, and that a live production official-publisher bypass depends on ClawHub exposing `owner.official` in production metadata.

For OpenClaw operators, this is one of the more consequential ClawHub hardening changes of the week: marketplace installs are now gated by upstream trust state before the archive crosses the local boundary.
