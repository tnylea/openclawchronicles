---
title: "OpenClaw Guests Can Start Managed Worktrees"
excerpt: "OpenClaw guests can now select registered projects, choose a managed worktree, and start isolated sessions without path exposure or broader operator scopes."
coverImage: '/assets/images/posts/openclaw-2026-10-14-guest-managed-worktrees.png'
date: '2026-10-14T08:15:00.000Z'
dateFormatted: October 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-14-guest-managed-worktrees.png'
---

OpenClaw merged a New Session UI fix that restores a useful collaboration path for guests. [PR #171811](https://github.com/openclaw/openclaw/pull/171811) lets guests who can create sessions select a registered or Gateway-cloned project, choose **New worktree**, and start an isolated session without broader operator scopes.

The bug was subtle: the project list correctly omitted host paths for guests, but the repository controller treated those path-redacted rows as idle. That hid the checkout control, even though creation by project ID already supported a managed worktree.

## What Guests Can Do Now

With the fix, a guest can:

- Select a registered project in New Session
- Choose a managed worktree
- Leave the base reference blank and let the Gateway choose the repository default
- Start an isolated session using only session-scoped access

The request carries the existing project ID and worktree intent to `sessions.create`. It does not need to disclose a host path, and it does not add Gateway fields, scope grants, configuration, or path visibility.

If creation is refused, the UI preserves the selected project and isolation intent so the user can correct the problem or retry.

## Why It Matters

Managed worktrees are one of OpenClaw's stronger collaboration primitives. They let work happen in an isolated checkout rather than directly in the main project directory. For guests, that isolation is especially important: it allows contribution-style sessions without granting broad operator authority or exposing filesystem details.

The previous UI behavior created an odd mismatch. The backend could accept the safe project-ID-based creation path, but the UI did not expose the control when the project row had no host path. The fix aligns the interface with the existing Gateway behavior.

## Path Privacy Stays Intact

The PR is careful about the boundary. The UI now distinguishes a path-redacted registered project awaiting creation-time validation from an inspected Git checkout. Clients with disclosed checkout paths keep the existing inspection flow. Guests without path access get the worktree option through project identity, not through filesystem disclosure.

That is the right shape for shared systems: give the user the capability they are authorized to use, but avoid revealing local implementation details they do not need.

## Verification

The PR includes browser proof from an authenticated guest flow and regression coverage for project selection, worktree submission without a host path or forced reference, and preservation of isolation after an actionable creation refusal.

It also strengthens the sandbox-project integration to use real guest Gateway request admission and verify managed ownership while retaining the direct-access rejection. The focused candidate passed formatting, lint, affected type checks, and 138 tests across nine files. The two new UI cases fail on the baseline because the checkout control is hidden, which is exactly the bug being fixed.

The result is a cleaner guest workflow: registered project, new worktree, nonempty first message, running isolated session. No path leak required.
