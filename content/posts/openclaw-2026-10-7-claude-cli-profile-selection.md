---
title: "OpenClaw Fixes Claude CLI Profile Selection"
excerpt: "OpenClaw plugin completions now use the configured Claude CLI account order instead of failing with 401 when no profile is selected."
coverImage: '/assets/images/posts/openclaw-2026-10-7-claude-cli-profile-selection.png'
date: '2026-10-07T08:15:00.000Z'
dateFormatted: October 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-7-claude-cli-profile-selection.png'
---

OpenClaw merged a P1 fix this morning for Claude CLI plugin completions, including Memory Dreaming, when an Anthropic managed profile exists but no profile is explicitly selected.

[PR #166173](https://github.com/openclaw/openclaw/pull/166173), "fix: Claude CLI plugin completions return 401 without a selected profile," makes isolated plugin completions use the same shared CLI auth selector that user and cron callers already use.

Before this change, an ordered managed Anthropic profile could exist, but the isolated-completion caller forwarded only the request's optional profile. If no explicit profile was set on that request, plugin completions could fail with HTTP 401 or fall back to another provider.

## What Users Get

Fresh plugin completions now follow the configured account order while preserving explicit account selections and native Claude login behavior.

That means a user can configure Anthropic account order once, then expect plugin-owned completions to resolve the same way as other OpenClaw callers. The fix does not add new configuration, change SDK surface area, introduce a migration, or create a plugin-owned authentication policy.

This is especially relevant for plugin workflows that call into subagent completion behind the scenes. Memory Dreaming is the named example in the PR, but the underlying issue was in the isolated-completion path rather than a single plugin.

## What Changed Under The Hood

The Claude CLI backend intentionally disables runner auto-selection. Selection has to happen before dispatch, through OpenClaw's shared selector, because that selector owns account eligibility and native-login safeguards.

The isolated-completion caller now uses that shared selector before it dispatches work to the CLI runner. The PR also documents plugin behavior, covers both explicit managed and native selections, and removes an incorrect comment about auto-selection.

The important boundary is that native Claude login remains native. If a setup uses the CLI's own logged-in state, OpenClaw should not inject a managed credential into that flow.

## Evidence From the PR

The PR includes a real Gateway proof with a synthetic plugin that uses documented plugin SDK entry points, registers a Gateway method, and calls `api.runtime.subagent.complete`. Each case starts a real Gateway with fresh state, config, and home directories on an ephemeral loopback port.

For the managed-order case, two synthetic profiles were seeded through the supported auth CLI, and account order selected the second one. The plugin supplied no profile. On the candidate, the RPC succeeded and the fake Claude executable confirmed that the selected credential reached file descriptor transport without appearing in argv or environment. On main production, the same managed-order case failed with HTTP 401 because no selected profile was forwarded.

The native-only candidate case also succeeded, with no managed credential descriptor attached. That proves the fix does not trample native Claude login.

Beyond the live proof, exact-head CI passed. The focused isolated-completion test file reported 51 passes, seven related auth and Gateway files passed in routed Vitest shards, core type checks passed, and the full build passed.

## Why It Matters

OpenClaw's model and auth system is increasingly multi-path: user turns, cron jobs, plugins, native CLI runtimes, and managed profiles can all meet in the same installation. The more paths exist, the more important it is that they share one account-selection contract.

This PR closes one of those gaps. Plugin completions now use the configured Claude CLI account order like the rest of the product, instead of surprising users with a 401 at the moment a background completion tries to run.
