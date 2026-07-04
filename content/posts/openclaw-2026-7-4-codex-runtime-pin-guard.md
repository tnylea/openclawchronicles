---
title: "OpenClaw Blocks Stale Codex Runtime Pins"
excerpt: "OpenClaw release checks now fail closed when the Codex plugin would publish with an older embedded Codex runtime."
coverImage: '/assets/images/posts/openclaw-2026-7-4-codex-runtime-pin-guard.png'
date: '2026-07-04T23:02:00.000Z'
dateFormatted: July 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-4-codex-runtime-pin-guard.png'
---

OpenClaw merged [PR #100015, "fix(release): block stale Codex runtime pins"](https://github.com/openclaw/openclaw/pull/100015), a P1 release-safety change for the bundled Codex plugin.

The issue was not whether an installed host could find Codex. It was more subtle: the stable `@openclaw/codex` package could be published with an older embedded `@openai/codex` runtime even after a newer stable Codex release was already available.

That creates a false-green state. The OpenClaw updater can correctly decide that the plugin package is current, while the route launched by that package still uses a stale executable dependency.

## The Concrete Failure

The PR gives a specific example. On June 30, 2026, `@openclaw/codex@2026.6.11` was published with `@openai/codex@0.139.0`, even though `@openai/codex@0.142.4` had already been published on June 29, 2026.

Before this fix, the release pipeline checked internal package consistency, but it did not independently ask whether the selected executable dependency was current against npm's `latest` dist-tag.

For users, that distinction matters. A plugin can be internally consistent and still ship an older runtime than operators expect.

## What Changed

The fix moves the invariant to the release-owner boundary. `@openclaw/codex` now opts its `@openai/codex` executable dependency into a strict freshness contract through plugin metadata.

The generic plugin release checker then validates configured executable dependencies as exact runtime dependencies and resolves npm's `latest` dist-tag independently during release checks and release-plan collection.

If the pinned dependency is stale, or if the freshness check cannot be verified, release planning fails closed instead of accepting the artifact.

The PR also updates the Codex runtime pin from `0.142.4` to `0.142.5`, refreshes generated lock data, and regenerates the harness model snapshot from the actual `0.142.5` app-server.

## What It Does Not Do

This is intentionally not a broad runtime inspection system. The PR says it does not add generic-core Codex version policy, inspect arbitrary selected binaries at runtime, or change plugin update-channel behavior.

That restraint is important. Runtime inspection can produce false positives for supported alternate routes, and it cannot stop a stale artifact from being published in the first place. The fix targets the release validation point where the bad package can be blocked before users receive it.

## Validation

The PR reports five focused test files passing across 76 Vitest tests, including plugin npm release checks, ClawHub release checks, wrapper script tests, Codex manifest tests, and app-server model snapshot tests.

It also reports a successful Codex shrinkwrap check, a live npm-backed plugin release check for `@openclaw/codex`, and an AWS Linux Crabbox changed-lane run covering dependency guards, full typecheck, lint, and import-cycle checks.

A real `codex app-server` `model/list` probe reported server version `0.142.5`, which was used to update the public model snapshot. No npm publish was performed as part of the PR validation, and already-installed `@openclaw/codex@2026.6.11` packages remain unchanged until a new plugin release is published and installed.

## Bottom Line

OpenClaw's Codex plugin release path now has a sharper guardrail: a stale embedded Codex runtime should block publication instead of reaching operators as a seemingly current package.

For teams relying on Codex through OpenClaw, that means fewer hidden version gaps between the plugin they updated and the runtime it actually launches.
