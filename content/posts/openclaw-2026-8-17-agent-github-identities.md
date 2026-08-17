---
title: "OpenClaw Adds Per-Agent GitHub Identities"
excerpt: "OpenClaw now lets operators inspect and configure the GitHub CLI identity each local agent uses without changing shared host auth."
coverImage: '/assets/images/posts/openclaw-2026-8-17-agent-github-identities.png'
date: '2026-08-17T23:01:00.000Z'
dateFormatted: August 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-17-agent-github-identities.png'
---

OpenClaw merged a major agent-identity change in [PR #125199](https://github.com/openclaw/openclaw/pull/125199), adding a way to inspect and configure the GitHub CLI account used by each local agent.

The feature targets a practical problem for shared Gateway installs. When multiple agents run on one host, repository actions can become tangled with the host user's global `gh auth` state or with bearer tokens injected into the environment. That can lead to the wrong account being used, confusing 403 errors, or operators changing global credentials just to steer one agent.

## What Changed

The new flow adds a GitHub identity card under **Agents -> Tools**. With no custom configuration, OpenClaw reports and preserves the native GitHub CLI identity available to the Gateway runtime user. Operators can then choose a managed system identity or a per-agent override.

The PR describes several pieces working together:

- visible effective GitHub account status
- managed system-level identity
- complete per-agent identity overrides
- one-use secret handoffs for pasted tokens
- private profile generations
- lifecycle-owned expiry and cleanup
- Git author configuration
- projection into local OpenClaw and Codex start, resume, warm, and supervision paths

That is a wide surface because the change is not only a settings form. It creates a credential owner, a Gateway API/config boundary, and a process environment projection so local execution gets the intended identity consistently.

## Why It Matters

This is especially useful for teams running OpenClaw as a shared service. A support agent, release agent, and documentation agent may all need GitHub access, but not necessarily the same GitHub account.

Before this change, selecting the correct account could mean mutating shared `gh` state or relying on ambient environment variables. With PR #125199, operators can inspect what an agent will actually use, set a shared default, and override individual agents without changing the host's global login.

The behavior is also intentionally fail-closed. The PR says managed identities fail closed when their private profile is unavailable instead of silently falling back to another account. That boundary matters for repository writes because using the wrong identity can be worse than failing.

## Security Boundaries

The PR is careful about what it does and does not claim. It selects the local `gh` CLI/API identity and optional Git author. It does not claim generic Git transport isolation, does not forward credentials to cloud workers, and does not publish reconciled cloud branches.

Tokens are pasted once and are not returned to the browser. Managed profile generations retire on Gateway restart, and setup handles are opaque. The PR also notes that unrestricted host execution under the same OS account is not adversarial isolation; deployments that need that boundary still need sandboxing or dedicated users.

## Evidence From The PR

The merged PR reports exact-head CI passing, focused owner-boundary coverage, protocol and native client generation checks, Control UI behavior coverage, and a canonical eight-config Codex sweep with 3,783 tests passing.

The live proof created a disposable isolated managed profile, verified the selected account with `/user`, confirmed ambient GitHub token precedence was blanked for child preparation, checked private profile file modes, and deleted the temporary state.

For OpenClaw operators, the visible result is a clearer and safer answer to a basic question: which GitHub account will this agent use when it touches a repo?
