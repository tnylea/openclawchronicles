---
title: "OpenClaw Locks Down Shared Terminal Input Permissions"
excerpt: "OpenClaw now keeps shared terminal input under session permissions, closing a P0 path where agents could control terminals without approval."
coverImage: '/assets/images/posts/openclaw-2026-8-25-terminal-input-permissions.png'
date: '2026-08-25T23:02:00.000Z'
dateFormatted: August 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-25-terminal-input-permissions.png'
---

OpenClaw merged a high-priority security-boundary fix tonight with [PR #129604](https://github.com/openclaw/openclaw/pull/129604), tightening how agents interact with Gateway-hosted terminals. The change closes a P0 issue where an agent could create and control its own terminal without honoring the execution permissions chosen for the session.

That is exactly the kind of boundary that matters in an agent runtime. Terminals are powerful because they bridge model intent into a live host environment. OpenClaw's fix moves terminal creation back to the authenticated operator in Control UI and keeps agent-side input under the same permission model as command execution.

## What Changed

The merged PR makes terminal ownership explicit. Agents can still collaborate with terminals, but only terminals that the operator has already opened for the exact session. They may list, read, resize, and close those session-owned terminals, but input is governed by the session's current execution policy.

The practical rules now line up with the rest of OpenClaw's execution model:

- Full access can send input immediately.
- Guarded and workspace or allowlist modes require a fresh one-time approval that shows the exact input.
- Read-only or denied execution rejects terminal writes.
- Permanent approvals are not silently reused for ongoing terminal control.
- CLI and MCP grants carry the prepared permission mode and keep cached tool surfaces isolated by policy.

The PR also removes obsolete detached-task terminal ownership plumbing. That matters because security-sensitive code gets easier to audit when there is one clear owner for a capability instead of several older paths that still know how to touch it.

## The Final Authority Check

The most important detail is the final synchronous fence before the PTY is touched. According to the PR, every terminal-input mode revalidates the live run, receipt authority, Gateway, terminal owner, and session immediately before writing to the terminal.

That closes several stale-authority cases. Missing runs, released runs, replaced runs, canceled runs, aborted runs, stale sessions, unavailable reviewers, and disallowed permanent approvals all fail closed. Even Full access, which does not prompt, still goes through this final authority check.

## Why Operators Should Care

For operators, the visible workflow should stay familiar. You can still open and use interactive terminals from Control UI, including while an agent is in a read-only session. The difference is that the terminal is now clearly an operator-owned surface, and risky agent input follows the selected session policy.

For teams experimenting with shared terminals, this is a meaningful hardening step. It keeps terminal collaboration possible while preventing an agent-created shell from becoming an unreviewed side door around the permissions selected for that session.

## Validation

The evidence on the PR is substantial. The team reports a complete application, plugin, and Control UI build with `node --import tsx scripts/build-all.mts`; 598 focused tests across terminal tools, CLI and MCP grants, Gateway terminal routing, approvals, prompt contracts, session archival, PTY lifecycle, cron cleanup, and CLI preparation; plus the full changed-file repository gate.

The live proof used an isolated real Gateway, authenticated WebSocket operator clients, and five real `/bin/sh` PTYs. It covered operator-only opening, active Full-access writes, four exact-input approval events, guarded and workspace approvals, rejection of `allow-always`, read-only and disabled execution rejections, exact-session isolation, preserved operator typing, and agent resize and close.

The fix is a security advisory in all but name: no new feature flag, no new setting, just a tighter boundary around one of the sharpest tools an agent can touch.
