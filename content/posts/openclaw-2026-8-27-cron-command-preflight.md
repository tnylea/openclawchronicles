---
title: "OpenClaw Cron Adds Command Preflight"
excerpt: "OpenClaw cron jobs now fail early when retained command automations lack shell access, giving operators structured repair guidance."
coverImage: '/assets/images/posts/openclaw-2026-8-27-cron-command-preflight.png'
date: '2026-08-27T23:10:00.000Z'
dateFormatted: August 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-27-cron-command-preflight.png'
---

OpenClaw's automation layer has a new guardrail for retained cron jobs. PR [#131123](https://github.com/openclaw/openclaw/pull/131123) adds a preflight failure path for `agentTurn` jobs whose structured `Command to run:` block cannot actually use a shell or process tool.

Before this fix, Doctor could identify the mismatch, but normal cron execution did not stop at the same boundary. The model would receive a command it had no authority to run, explain the problem in prose, and the cron run could still look successful because structured terminal evidence never recorded a real failure.

## The Failure Mode

Cron status intentionally trusts structured execution evidence rather than assistant text. That is the right design for automation, but it exposed a gap: a restricted job could narrate that it could not run a command while the status layer still reported `ok`.

The new preflight closes that gap before spending a model turn. When a retained automation contains the deterministic command-block shape and lacks any shell or process-capable tool, OpenClaw now records a structured `cron-preflight` error.

The error includes:

- The affected job name
- Confirmation that no command ran
- A reauthorization path
- A command-automation repair path

That gives operators something actionable in CLI and dashboard views instead of a misleading green run.

## Tool Authority Stays Explicit

The PR is careful about authority. It does not silently grant shell access, reinterpret arbitrary assistant output, or convert a restricted job into a command job. Those choices would cross the stored authority boundary.

Instead, the preflight uses the canonical runtime-capability matcher. That matters because earlier local logic mishandled valid grouped policies such as `group:runtime`, and wildcard caps such as `exec*` could survive final filtering without constructing the shell factory they implied.

Construction planning now applies aliases, groups, globs, and attached intersections against the canonical descriptor catalog. One compatibility rule remains deliberately split: the established `write` to `apply_patch` compatibility does not by itself select shell construction.

## What This Means For Cron Users

For operators, the behavior is simpler. If a cron job is supposed to run a command, it needs explicit command-capable authority. If it lacks that authority, OpenClaw should fail quickly, preserve evidence, and explain what must be changed.

The change also keeps explanatory prompts untouched. Merely mentioning a command in natural language does not trigger the preflight; the guard is scoped to the existing structured command block used for retained command automations.

## Verification Notes

The PR reports 317 focused tests across tool policy, embedded-agent tool construction, Copilot bridge behavior, isolated cron tool allowlists, Doctor cron migration checks, MCP runtime behavior, and worker authority. It also includes source-blind CLI and Gateway validation where the broken fixture failed in 11 milliseconds without provider or model metadata.

The branch was marked P1 and compatibility-risk because cron status is an operator-facing trust surface. A green automation run should mean the requested command path was actually valid, not merely that the assistant explained why it could not proceed.

## Bottom Line

OpenClaw cron now has a firmer contract for command automations. Jobs that cannot run their stored command fail before model execution, and operators get structured evidence instead of a deceptively successful run.
