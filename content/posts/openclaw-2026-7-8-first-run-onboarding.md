---
title: "OpenClaw Fixes First-Run Onboarding"
excerpt: "OpenClaw fresh installs now enter onboarding before gateway probes, preventing missing auth, config, and service state."
coverImage: '/assets/images/posts/openclaw-2026-7-8-first-run-onboarding.png'
date: '2026-07-08T08:10:00.000Z'
dateFormatted: July 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-8-first-run-onboarding.png'
---

OpenClaw merged [PR #101901, "fix(installer): complete first-run onboarding"](https://github.com/openclaw/openclaw/pull/101901), a P0 installer fix for fresh git installs that could otherwise report success before the system was actually ready to run.

The PR moves new installs into onboarding before Doctor checks or Gateway finalization probes. That ordering matters because onboarding is the step that creates the first-run configuration, persists Gateway authentication, and prepares managed service state.

## What Broke

The PR describes a fresh install path that could finish without creating `~/.openclaw/openclaw.json`, Gateway authentication, or a managed Gateway service. Follow-up commands then failed twice: first because the user's shell could still resolve an old `/usr/bin/openclaw` path, and then because the new install still lacked gateway mode, auth, and service state.

The Control TUI could also fail with `Missing gateway auth token` because setup had never completed the authentication step.

That is a rough first experience for new operators. A successful install should leave the next command usable, not send the user straight into missing-token and stale-PATH failures.

## What Changed

The installer now treats first-run onboarding as the finalization path for fresh installs. In practice, that means:

- Fresh installs enter onboarding before Doctor or Gateway health probes.
- Follow-up commands use the just-installed OpenClaw binary.
- The installer explains `hash -r` when a shell is still caching a removed binary path.
- Onboarding persists Gateway configuration and authentication before the managed service is installed or started.
- Configured upgrades keep their existing Doctor, plugin update, Gateway restart, and dashboard behavior.

That last point is important. The PR does not replace upgrade health checks with onboarding. It separates the fresh-install path from the already-configured upgrade path.

## Why It Matters

OpenClaw installations often include local services, auth files, gateway mode, shell paths, and optional managed service startup. If those steps happen in the wrong order, a command can look like it installed cleanly while leaving the operator with an unusable runtime.

This fix makes first-run setup more honest. New installs should complete the state they need before later health probes decide whether the environment is configured.

It also makes stale shell path behavior less mysterious. Users who recently removed or replaced an `openclaw` binary can get a concrete explanation instead of chasing a command that points at the wrong location.

## Validation

The PR reports 61 passing installer regression tests through `node scripts/run-vitest.mjs test/scripts/install-sh.test.ts`, plus `bash -n scripts/install.sh`, `git diff --check`, and a clean structured autoreview.

The real-behavior proof covers fresh-install onboarding, configured-upgrade Doctor behavior, stale PATH handling, no-TTY guidance, Gateway finalization ordering, and successful-upgrade dashboard behavior.

The author also notes one boundary clearly: an isolated black-box fresh install was terminated after dependency installation continued beyond 23 minutes, so the PR does not claim a completed full fresh-VPS artifact.

## Bottom Line

OpenClaw fresh installs should now finish through onboarding instead of skipping the state that makes the first real command work. For new users, that should turn a brittle install-success message into a more complete setup path.
