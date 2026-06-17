---
title: "OpenClaw QA Lab Adds Script Evidence Runs"
excerpt: "OpenClaw QA Lab now supports script-backed evidence scenarios, setting up richer proof artifacts and maturity scorecard workflows."
coverImage: '/assets/images/posts/openclaw-2026-6-17-qa-lab-script-evidence.png'
date: '2026-06-17T23:02:00.000Z'
dateFormatted: June 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-17-qa-lab-script-evidence.png'
---

OpenClaw's QA Lab picked up a useful new execution mode tonight. [PR #94276](https://github.com/openclaw/openclaw/pull/94276), merged at 22:09 UTC, adds script-backed evidence scenarios to the QA scenario catalog.

The short version: QA Lab can now run scenarios whose producers create their own `qa-evidence.json` artifacts, then import those artifacts into the suite evidence output. That gives OpenClaw a cleaner path for testing workflows that do not fit neatly into the existing flow, Vitest, or Playwright lanes.

It is infrastructure work, but it is not boring infrastructure. Evidence is becoming one of the main ways OpenClaw proves that agent-facing behavior actually worked after a change.

## What Script Scenarios Add

The PR says QA Lab already supported flow, Vitest, and Playwright-backed scenarios. The new `script` execution kind adds another layer for producers that need to run a custom Node or TSX script and emit structured evidence.

The implementation includes:

- `scenario.execution.kind: script` in the QA scenario catalog schema
- Node/TSX execution with `${outputDir}` and `${scenarioId}` argument token expansion
- Import of producer-written `qa-evidence.json` artifacts
- Fallback evidence when the script process itself fails
- Script-backed evidence counted in QA coverage and scorecard reporting

That fallback behavior matters. A failing evidence producer is still evidence. QA Lab can preserve a script-runner artifact rather than leaving operators with a silent gap.

## Why This Matters For OpenClaw

OpenClaw is no longer testing a small CLI surface. It now spans channel delivery, model routing, desktop and mobile sessions, Gateway APIs, skills, plugins, schedulers, media generation, managed auth, and user-facing agent workflows.

Some of those behaviors are easiest to prove with a normal unit test. Others need an end-to-end script that sets up state, talks to a local service, produces artifacts, and then lets a reviewer inspect the result.

Script-backed QA scenarios give that second class of proof a first-class lane. They also avoid turning every custom validation into a one-off CI script that nobody can discover later.

## Claw Score Lands Alongside It

The evidence work also pairs naturally with [PR #94263](https://github.com/openclaw/openclaw/pull/94263), which migrated an OpenClaw-local `claw-score` skill into the repository. That PR adds a skill adapted from Kevin Lin's maintainer repo work and scopes it to root `taxonomy.yaml`, aggregate maturity scores, and redacted QA evidence artifacts.

The two PRs are separate, and PR #94263 does not add runtime or docs rendering behavior by itself. But the direction is clear: OpenClaw is building a more repeatable loop between taxonomy, scorecards, QA evidence, and human review.

That is useful for contributors, too. A feature can ship with proof that fits the same evidence model as the rest of the project instead of relying on screenshots, ad hoc terminal logs, or prose buried in a PR body.

## What Was Proven

PR #94276 includes real behavior proof from a local OpenClaw checkout. The author ran QA coverage commands after the patch and showed the CLI recognizing a Playwright scenario match without schema or catalog errors.

Supplemental validation included focused scenario runner, coverage report, catalog, and suite-launch tests, plus extension build, typecheck, lint, bundled extension lint, and diff checks.

The PR explicitly does not include the UX Matrix scenario, evidence gallery UI, dashboard script, or GitHub Action wiring. Those are expected follow-up slices.

## The Takeaway

QA Lab script scenarios are a feature preview for a more evidence-driven OpenClaw. They make it easier to treat custom runtime checks as durable QA assets rather than disposable scripts.

That is exactly the kind of foundation a large agent runtime needs. As OpenClaw's surface area grows, the project needs proof formats that are structured enough for automation and readable enough for humans.

Sources: [OpenClaw PR #94276](https://github.com/openclaw/openclaw/pull/94276), [OpenClaw PR #94263](https://github.com/openclaw/openclaw/pull/94263), and the [OpenClaw repository](https://github.com/openclaw/openclaw).
