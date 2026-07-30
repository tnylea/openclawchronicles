---
title: "OpenClaw Plugin Scans Now Show Every Exec Call"
excerpt: "OpenClaw plugin security scans now report multiple executable calls per file, giving reviewers complete bounded evidence."
coverImage: '/assets/images/posts/openclaw-plugin-scan-executable-calls.png'
date: '2026-07-30T08:02:00.000Z'
dateFormatted: July 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-plugin-scan-executable-calls.png'
---

OpenClaw merged a P1 security-review fix this morning for plugin package scanning. [PR #116222](https://github.com/openclaw/openclaw/pull/116222), titled `fix(security): expose every executable call in plugin scans`, closes a visibility gap in the scanner used to review potentially dangerous execution sites.

Before the patch, the line-rule scanner could stop after the first matching executable call in a file. That meant a file with several process-execution sites might produce incomplete review evidence. For a marketplace or package-security workflow, incomplete evidence is its own risk: reviewers need to see each relevant call, not just the first one that matched.

## What Changed

The scanner now reports distinct matches in source order. Each rule and file is capped at 32 findings, which keeps output bounded while still surfacing normal-volume execution sites. If an input is dense enough to exceed the cap, OpenClaw emits an aggregate overflow finding with the omitted count and final affected line.

That design is important because it avoids both bad extremes. It does not silently omit later calls in ordinary source files, and it does not let hostile or generated input flood scan output without limit.

The PR says existing context checks, benign member-call filtering, standard-port filtering, bounded evidence, and deterministic ordering remain in place.

## Why It Matters

OpenClaw plugins can extend what an agent is allowed to do. That makes package scanning part of the trust boundary between a useful extension ecosystem and unsafe code execution.

This patch is especially relevant for generated bundles and packages that contain more than one process or shell execution path. A reviewer looking at scan output should be able to answer a basic question: how many execution sites did this package expose, and where are they?

The PR includes a direct Codex package scan example. After a clean build, the scan reported 8 critical findings instead of 7, exposing both distinct `run-attempt` execution sites.

## Bounded, Not Blind

The cap of 32 findings per rule and file is a practical guardrail. The scanner still reads dense input to EOF, but the output changes from unbounded repetition into retained findings plus explicit overflow evidence. That means the review remains deterministic and readable without pretending the omitted matches did not exist.

## Verification

Focused scanner tests passed 36 out of 36. The dense-input regression proves 32 retained findings plus an aggregate for 8 omitted matches through the final affected line.

The PR also reports a clean `git diff --check` and a clean autoreview with 0.96 confidence. A broader local release test was blocked by a separate npm dry-run response shape, so the PR points to exact PR CI as the authoritative broader gate.

For operators and plugin reviewers, the headline is simple: OpenClaw plugin scans now prefer complete bounded evidence over first-match shortcuts.
