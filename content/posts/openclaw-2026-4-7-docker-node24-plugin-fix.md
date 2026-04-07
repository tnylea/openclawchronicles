---
title: "OpenClaw Docker Fix: Node 24 Bundled Plugin Crash Resolved"
excerpt: "A newly merged PR fixes Docker runtime images crashing under Node 24 due to a bundled plugin path override pointing at source instead of compiled artifacts."
coverImage: '/assets/images/posts/openclaw-2026-4-7-docker-node24-plugin-fix.png'
date: '2026-04-07T08:00:00.000Z'
dateFormatted: April 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-7-docker-node24-plugin-fix.png'
---

If you run OpenClaw in Docker and recently upgraded to a Node 24-based image, you may have noticed bundled plugins failing to load at startup. A fix landed in the main branch this morning — [PR #62316](https://github.com/openclaw/openclaw/pull/62316) by [@gumadeiras](https://github.com/gumadeiras) — and it resolves a subtle but painful regression affecting Docker deployments.

## What Was Breaking

The root cause was an environment variable override in the Dockerfile: `OPENCLAW_BUNDLED_PLUGINS_DIR` was explicitly set to point at the `extensions/` source tree inside the Docker runtime image. Under Node 24's native TypeScript loader behavior, this caused OpenClaw to attempt loading uncompiled plugin source entrypoints rather than the built `dist/extensions` artifacts — and crash immediately.

The issue was silent in older Node versions because of differences in how module resolution handled the mixed source/dist layout. Node 24 made the failure explicit.

## The Fix

The solution is clean and minimal: the `OPENCLAW_BUNDLED_PLUGINS_DIR` environment variable override was removed from the Dockerfile entirely. Without it, packaged installs now use the normal bundled-plugin resolver, which correctly targets the compiled `dist/extensions` output.

A Dockerfile guard test was also updated to prevent the override from sneaking back in future PRs — any attempt to re-add `OPENCLAW_BUNDLED_PLUGINS_DIR` to the runtime image will now fail the test suite.

A changelog entry was added under `Unreleased` documenting the behavior change and linking to the originating issue [#62044](https://github.com/openclaw/openclaw/issues/62044).

## Who Is Affected

You're impacted if all of the following are true:

- You deploy OpenClaw via Docker (using the official runtime image or a derivative)
- Your image uses Node 24 or later
- You rely on any bundled plugins (most users do — the browser, image generation, and many channel adapters are bundled)

If you're on Node 18 or 22, you likely haven't seen this issue yet, but the fix is still worth pulling in before you upgrade.

## What to Do Right Now

The fix is merged but not yet in a tagged release. Your options:

1. **Wait for the next release** (likely a patch release in the v2026.4.x line) — the safest option if you're not in a rush.
2. **Build from main** — if you maintain your own Docker image built from source, pull the latest `main` and rebuild.
3. **Workaround** — unset `OPENCLAW_BUNDLED_PLUGINS_DIR` in your own Dockerfile or docker-compose environment if you're inheriting the affected base image.

Watch the [OpenClaw releases page](https://github.com/openclaw/openclaw/releases) for the next patch drop. Given the severity for Docker users, expect a fast turnaround.

## Broader Context

This fix is a reminder that Docker deployments of OpenClaw have some quirks worth understanding. The runtime image bundles plugins in compiled form, but the source tree is also present for development workflows. The `OPENCLAW_BUNDLED_PLUGINS_DIR` variable is a power-user escape hatch — not something that should be set by default in production images.

If you're customizing your Docker setup, be conservative with environment variable overrides that touch plugin resolution. The normal resolver is well-tested; custom overrides tend to interact poorly with packaging changes.

For the full diff, see [PR #62316 on GitHub](https://github.com/openclaw/openclaw/pull/62316).
