---
title: "OpenClaw Code Mode Moves to JavaScript Only"
excerpt: "OpenClaw PR #154001 makes Code Mode execute JavaScript only while preserving typed API discovery, validation, budgets, and migration checks."
coverImage: '/assets/images/posts/openclaw-2026-9-20-code-mode-javascript-cutover.png'
date: '2026-09-20T23:01:00.000Z'
dateFormatted: September 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-20-code-mode-javascript-cutover.png'
---

OpenClaw merged a compatibility-sensitive Code Mode change in [PR #154001](https://github.com/openclaw/openclaw/pull/154001): agent-written orchestration now executes as JavaScript only.

The change removes TypeScript execution from the runtime path. That does not mean OpenClaw is dropping typed tool awareness. The PR says agents still get tool signatures and can inspect complete TypeScript declarations through `API.list` and `API.read`, while execution itself runs through JavaScript.

## What changed

Code Mode previously carried TypeScript compiler machinery so agent-authored cells could be compiled or checked before execution. The PR removes compiler loading, transpilation, compiler preflight, declaration cache behavior, TypeScript source maps, and language selection from the live execution path.

In their place, OpenClaw keeps the parts users actually need at runtime:

- JavaScript execution with source locations
- Schema-derived typed API discovery
- Runtime argument and result validation
- Existing permissions, cancellation, and execution budgets
- Clear migration errors for retired `language` and `typecheck` arguments

The PR also retires the global and per-agent `tools.codeMode.languages` setting through Doctor and eligible Gateway startup migration. Existing activation and limits are supposed to survive that migration.

## User impact

For day-to-day Code Mode usage, the important change is that existing TypeScript cells need to be rewritten as JavaScript. The PR explicitly calls that out rather than trying to silently emulate TypeScript behavior.

That is a breaking-style migration, but the blast radius is bounded: typed declaration discovery remains available, and TypeScript stays available to unrelated compiler API consumers and development-time declaration tests. The runtime no longer treats TypeScript as a supported Code Mode source language.

The benefit is a leaner execution path. Less compiler machinery means fewer moving pieces inside agent orchestration, while runtime validation remains the guardrail for tool calls.

## Why it matters

Code Mode sits in a sensitive part of OpenClaw: it lets agents compose tools programmatically. For that surface, simplicity matters. Removing an entire compile step reduces the amount of state and cache behavior the Gateway has to carry when all the agent needs at execution time is valid JavaScript and accurate tool contracts.

The migration is also explicit enough for operators to reason about. If a cell still depends on TypeScript syntax, it should fail with a migration error rather than drifting into a partially supported compatibility mode.

## Validation notes

The PR includes several layers of evidence. Real OpenClaw runtime calls verified typed declaration discovery, JavaScript execution, argument-validation failures, dependent read/write/readback behavior, persisted output, and interview checks.

The author also tested an installed `openclaw@2026.9.4` CLI updating to the candidate tarball. That proof verified removal of global and per-agent language settings, preservation of activation and limits, migration of the legacy agent roster, config backup, and healthy upgraded and fresh Gateway startups.

Additional AWS repair checks, Gateway matrix tests, changed-file formatting, lint, typechecks, and final-head CI are reported as passing. For users who rely on Code Mode, this is one of those upgrades worth reading before the next automation run: the API guidance remains typed, but the executable source language is now JavaScript.
