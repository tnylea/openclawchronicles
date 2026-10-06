---
title: "OpenClaw Refreshes Claude CLI Models After Login"
excerpt: "OpenClaw now rechecks Claude CLI login state after Gateway startup so model lists recover without a restart."
coverImage: '/assets/images/posts/openclaw-2026-10-6-claude-cli-login-refresh.png'
date: '2026-10-06T23:10:00.000Z'
dateFormatted: October 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-6-claude-cli-login-refresh.png'
---

OpenClaw merged a Claude CLI model-discovery fix tonight that removes a frustrating restart requirement from the Control UI and `openclaw models list`.

[PR #166305](https://github.com/openclaw/openclaw/pull/166305), "fix(models): recheck Claude CLI login for model lists after Gateway startup," addresses a stale-auth state. If Claude Code was logged out when the Gateway started, Claude CLI models could remain hidden or disabled even after the user logged in. The same stale state applied in reverse: logging out after startup was not reflected either.

## What Users See Now

After `claude auth login`, OpenClaw should show the right Claude CLI-backed models within about a minute. Users do not need to restart the Gateway, reload the page, or force a manual `models.list` refresh.

The logged-out presentation stays the same. The change is about keeping the model catalog aligned with the CLI's real authentication state after startup.

That is especially useful for setups where Claude Code is a normal runtime path rather than a one-off fallback. If the Gateway starts before the CLI login exists, the model picker should not permanently inherit that cold-start fact.

## What Changed Under The Hood

The model picker already used Claude Code's login state when deciding availability. The problem was that the ordinary read path did not recheck static CLI-backed providers.

OpenClaw now rechecks native CLI-backend logins for backends whose manifest declares synthetic auth references. Today, that means `claude-cli`.

The recheck is deliberately bounded:

- It runs in the background while model lists are being read.
- It deduplicates through the existing `loadAuth` path.
- It publishes a new catalog only when login state changed.
- It keeps startup's once-per-generation probe behavior intact.

In other words, a busy picker does not become a CLI process launcher. The PR reports at most one `claude auth status --json` probe per prepared catalog owner per 60 seconds, and only while someone is reading model lists.

## Why This Matters

Model availability is part of the front door for agent work. If the picker says Claude models are disabled after a user has already logged in, OpenClaw feels broken even when the underlying CLI is ready.

The fix also supports the newer documentation direction around Claude Code. Adjacent docs work now describes Claude CLI as a primary runtime path with canonical `anthropic/*` model references and an `agentRuntime` pin. If that is the recommended setup, availability refresh has to behave like a live runtime signal, not a startup-only snapshot.

## Evidence From the PR

The regression test starts a real in-process Gateway, uses the real Anthropic plugin and `models.list`, and replaces only the `claude` executable with a fixture that records auth probes.

The test begins with Claude unavailable at startup. A login inside the recheck window does not spawn another probe. After the window, the model becomes available with exactly one more probe. A logout later makes it unavailable again with one more probe. The PR says the test times out on the old catalog behavior and passes in about five seconds on the fix.

The live Control UI proof used two isolated Gateways, one on origin/main and one on the branch. Both started logged out. After placing Claude credentials into the isolated config directory, origin/main still showed disabled rows minutes later, while the fixed branch enabled the configured Claude models on the first open after the recheck window.

## Bottom Line

This is the kind of model-runtime polish that saves users from ritual restarts. OpenClaw now treats Claude CLI login state as something that can change during the life of a Gateway, and the model picker follows along without hammering the CLI.
