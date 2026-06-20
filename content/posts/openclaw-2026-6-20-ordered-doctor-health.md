---
title: "OpenClaw Doctor Adds Ordered Health Check APIs"
excerpt: "OpenClaw's doctor command now has a migration path for structured health checks while preserving trusted repair order and behavior."
coverImage: '/assets/images/posts/openclaw-2026-6-20-ordered-doctor-health.png'
date: '2026-06-20T23:00:00.000Z'
dateFormatted: June 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-20-ordered-doctor-health.png'
---

OpenClaw's `doctor` command is getting a safer migration path for structured diagnostics. [PR #86627](https://github.com/openclaw/openclaw/pull/86627), merged on June 20, integrates structured health checks with the ordered core doctor checks that operators already rely on.

That sounds internal, but it matters. `openclaw doctor` is one of the first commands people reach for when a local agent, gateway, channel, or plugin setup does not behave. The command needs to become more structured without losing the careful order and repair behavior that make it trustworthy.

## The Migration Problem

Doctor checks have two competing needs.

First, OpenClaw needs structured findings: check ids, severity, dry-run previews, effect reports, lint output, and eventually extension-provided health checks. Second, the existing `doctor` and `doctor --fix` ordering cannot be casually rearranged. A repair command that mutates state in the wrong order can create upgrade problems or make troubleshooting harder.

This PR creates a migration ladder instead of a big switch.

Core doctor checks stay owned by `resolveDoctorHealthContributions()` and `createDoctorHealthContribution(...)`. Those contributions remain the source of truth for `openclaw doctor` and `openclaw doctor --fix` ordering.

At the same time, a core contribution can now declare structured `healthChecks` directly.

## How The New Shape Works

The PR describes three phases for a core rule.

In the safe first step, a rule keeps its old `run` behavior and adds an inline structured health check. The legacy path still owns real doctor behavior, while the structured check supplies lint findings.

If a rule can describe fixes before fully owning repair, it can add preview-only structured repair data for dry-run, diff, and effect reporting.

Only when a rule is ready does it remove the legacy `run` path and move real repair behavior behind the structured health check.

That preserves the working doctor order while letting maintainers migrate one rule at a time.

## Core Checks Before Extensions

The PR also clarifies the boundary between core OpenClaw checks and extension or plugin checks.

Core checks do not register into the shared health registry for ordering. Their order comes from the doctor contribution list. Bundled and plugin registry checks run after the ordered core contribution checks.

The proof used a Policy plugin check to verify that behavior. The reported ordered subset placed `core/doctor/gateway-config` and `core/doctor/command-owner` before `policy/policy-jsonc-missing`, with 19 core checks and 52 extension checks counted in the test environment.

That is exactly the kind of invariant an operator wants: core readiness first, extension health after.

## Validation

The PR includes a large validation set covering doctor lint tests, heartbeat template repair tests, agent workspace template tests, PDF model-config tests, linting, formatting, TypeScript checks, and targeted fast/unit suites.

It also tested a real source-entry command path:

`doctor --lint --json` was run with selected core and registered non-core checks, returning structured findings for gateway config, Policy plugin JSONC, and command owner configuration.

The exit code was expected to be non-zero because those selected checks intentionally reported findings.

## Why This Is Worth Covering

This is not a user-interface feature. It is an operator trust feature.

OpenClaw is accumulating more channels, plugins, runtime modes, and repair paths. The more complex the system gets, the more important it becomes that `doctor` can explain problems in structured form without making fixes unpredictable.

PR #86627 gives maintainers a conservative path: add structure, keep order, preserve repair semantics, and let plugins extend health checks without competing with core doctor flow.
