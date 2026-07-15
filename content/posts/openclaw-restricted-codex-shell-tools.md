---
title: "OpenClaw Restores Shell Tools for Restricted Codex Runs"
excerpt: "OpenClaw fixed restricted Codex turns so explicitly allowed shell tools remain available without reopening the native Code Mode surface."
coverImage: '/assets/images/posts/openclaw-restricted-codex-shell-tools.png'
date: '2026-07-15T08:01:00.000Z'
dateFormatted: July 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-restricted-codex-shell-tools.png'
---

OpenClaw merged a Codex runtime fix this morning that restores a narrow but important behavior for restricted turns. [PR #92294](https://github.com/openclaw/openclaw/pull/92294), titled `fix(codex): restore shell for restricted turns`, makes sure OpenClaw `exec` and `process` tools remain available when a finite runtime allowlist explicitly includes them.

Before the fix, a restricted Codex turn could disable Codex's native Code Mode surface while still allowing OpenClaw's own shell tools. The harness then removed those OpenClaw shell tools as if they were Codex-owned, leaving the turn with neither shell surface. That is a bad failure mode for carefully scoped automation: the policy said a shell tool was allowed, but the runtime removed the tool needed to complete the task.

## The Boundary Being Clarified

The PR distinguishes between two cases that sound similar but have different meanings in Codex:

- An omitted `environments` field selects the default local environment.
- An explicit empty environment list disables environment access.

That distinction matters when OpenClaw decides whether a shell capability is native Codex surface area or an OpenClaw-managed tool that was deliberately allowed. The fix keeps OpenClaw shell tools available only when the runtime allowlist says they should be available.

The PR body notes live scheduled-run proof: a run with `toolsAllow=[exec,process]` executed one OpenClaw `exec` call, while a negative run with `toolsAllow=[process]` did not execute the marker. That is the behavior operators want: allowlists remain enforced, but permitted tools are not accidentally stripped.

## Why It Is Significant

This PR carries `P1`, `extensions: codex`, and `merge-risk: security-boundary` labels. It is not just a convenience fix for developers who like shell access. It is a policy-precision fix for agent runs where tool surfaces are intentionally reduced.

Restricted tool runs are useful for:

- Scheduled jobs that can inspect but not modify
- Review tasks with explicit command limits
- Delegated agents that get only a small operational surface
- Automations that need `exec` but should not inherit the full native environment

When those restrictions are wrong, users either lose useful automation or loosen the policy to get work done. This patch helps avoid that tradeoff.

## Operator Takeaway

The main lesson is that OpenClaw is refining the difference between "no environment" and "explicitly allowed OpenClaw tools." If you are building locked-down Codex workflows, this change should make finite allowlists behave more predictably.

It also pairs naturally with the cron tool-cap hardening that landed in the same morning window: OpenClaw is tightening both sides of tool policy, ensuring jobs do not gain tools they should not have and do not lose tools they were explicitly granted.
