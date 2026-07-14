---
title: "OpenClaw Blocks Cloud SDK Env Controls"
excerpt: "OpenClaw now blocks workspace CLOUDSDK_ values during Gmail setup so untrusted project .env files cannot steer Google Cloud SDK launches."
coverImage: '/assets/images/posts/openclaw-2026-7-14-cloud-sdk-env-controls.png'
date: '2026-07-14T08:00:00.000Z'
dateFormatted: July 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-14-cloud-sdk-env-controls.png'
---

OpenClaw merged a P0 hardening fix Tuesday morning for Gmail setup in untrusted workspaces. The change blocks workspace `.env` entries from influencing Google Cloud SDK launch controls, closing a narrow but important setup-time trust boundary.

The issue was specific to users running OpenClaw from a workspace that could contain project-local environment variables. During Gmail setup, those values could influence Google Cloud SDK runtime controls if they used the `CLOUDSDK_` namespace.

Source: [OpenClaw PR #103918](https://github.com/openclaw/openclaw/pull/103918)

## What Changed

Workspace `.env` loading now blocks the `CLOUDSDK_` namespace. That means Google Cloud SDK runtime controls are not imported from project-local env files while OpenClaw is running Gmail setup.

The PR also makes two related changes:

- Gmail setup clears inherited Cloud SDK Python argument controls before spawning `gcloud`.
- The shared process environment merge now treats explicit `undefined` overrides as removals.

That second point matters because environment scrubbing only works if a caller can reliably remove an inherited value. If `undefined` is ignored, a supposedly cleared variable can survive into the child process.

## Why It Matters

Gmail setup crosses from OpenClaw into the user's local Google Cloud tooling. That makes the launch environment part of the security story.

Workspace `.env` files are useful for application configuration, but they are not automatically trusted to steer infrastructure tooling. A repository can be cloned from somewhere else, opened for review, or used as a temporary workspace. In those situations, project-local env files should not get to control how `gcloud` launches Python or interprets its own runtime settings.

The fix keeps the line simple: normal user-defined non-control workspace env keys still load, but Cloud SDK control values must come from trusted shell state, global configuration, or explicit setup paths rather than the current project directory.

## User Impact

For most users, Gmail setup should behave the same. The difference shows up when a workspace tries to provide Cloud SDK control variables through `.env`.

After this change, users can run Gmail setup from a project workspace without allowing that project's env file to steer the Google Cloud SDK Python launcher or argument handling. Trusted global env files and ordinary non-control workspace keys remain available.

This is the kind of hardening that reduces surprise. Gmail setup should be about connecting a mailbox, not silently inheriting launch controls from the repository that happened to be open.

## Verification

The PR reports focused Vitest coverage across Gmail setup utilities, dotenv handling, and process execution:

- Gmail setup utilities: 6 tests passed.
- Dotenv handling: 35 tests passed.
- Process exec behavior: 20 tests passed.
- `git diff --check` completed cleanly.

Remote Testbox warmup was unavailable during the authoring session, but the focused local proof covers the exact surfaces changed by the patch.

