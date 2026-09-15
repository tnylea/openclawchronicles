---
title: "OpenClaw Fixes Cron Tool Allowlists"
excerpt: "OpenClaw PR #149375 makes scheduled jobs honor explicit tool restrictions across OpenClaw and Codex harnesses."
coverImage: '/assets/images/posts/openclaw-2026-9-15-cron-tool-allowlists.png'
date: '2026-09-15T23:02:00.000Z'
dateFormatted: September 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-15-cron-tool-allowlists.png'
---

OpenClaw merged [PR #149375](https://github.com/openclaw/openclaw/pull/149375), a P2 compatibility fix for scheduled jobs that depend on precise tool restrictions.

The bug sat at the boundary between scheduled automation and the tool runtime. Cron jobs could lose permitted tools, or fail to respect an explicitly empty tool allowlist, as work moved across the OpenClaw and Codex harnesses. For automation, that is exactly the wrong place for ambiguity: a job should receive the tools its creator allowed, and no more.

## What Changed

The headline behavior is simple: `--tools ""` now reliably disables a job's agent tools. At the same time, existing aliases, groups, wildcards, Canvas widgets, bundled MCP tools, and LSP tools continue to work when the active restrictions permit them.

The repair keeps independent restrictions intact through several handoff points:

- Tool construction
- Tool discovery
- Inheritance
- Harness transfer
- Codex dynamic-tool and MCP registration

The PR also moves Codex onto the shared runtime filter. An optional alias callback lets different permitted names identify the same shell tool without requiring existing callers to change their signatures.

That is an important compatibility detail. The fix is not a new migration, setting, or policy surface. It corrects the intersection semantics that already existed: every active restriction must permit the concrete tool, including through its supported aliases.

## Why It Matters

Scheduled OpenClaw work often runs without a human watching every step. That makes tool scope one of the core safety contracts. A nightly job, reminder, content pipeline, or internal maintenance task should not accidentally grow a broader tool set because two runtimes interpreted the allowlist differently.

The opposite matters too. If a job is supposed to use Canvas, an MCP bundle, or a shell alias that the owner explicitly allowed, the handoff should not strip that capability away. Tool caps that are too loose are risky; tool caps that are too brittle make automation unreliable.

PR #149375 aims at both sides of that line. It keeps empty allowlists empty, preserves allowed aliases, and removes duplicate parsing paths that could drift over time.

## The Proof

The PR says the regression cases failed before their corresponding repairs. Focused coverage includes cron CLI creation and editing, isolated execution, triggers, fallbacks, OpenClaw direct/search/code surfaces, tool inheritance, bundle discovery, Canvas registration, and Codex dynamic-tool and MCP registration through an isolated app-server fixture.

The final shared-filter and Codex suites passed 200 tests, including shell-alias intersection regressions. A later patch-identical rebase brought in an unrelated fixture fix, and the combined tree passed 382 tests across seven cron, protocol, OpenClaw execution, and Codex files.

Independent review reported no actionable P0-P2 findings. The SDK API comparison found only the expected optional callback and compatible readonly parameter changes, with no removed exports or entry points.

## What To Watch

The PR notes that third-party plugin behavior was not exercised directly. The validation instead covered the SDK API shape and representative OpenClaw and Codex consumers.

For operators, the practical takeaway is that scheduled work should now obey tool allowlists more predictably across harnesses. Cron jobs that deliberately run with no agent tools, or with tightly scoped aliases and bundles, should be easier to reason about.
