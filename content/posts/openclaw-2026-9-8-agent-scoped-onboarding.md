---
title: "OpenClaw Scopes Onboarding by Agent"
excerpt: "OpenClaw onboarding recommendations now accept explicit agent selection, preventing ambiguous workspace reads from touching the wrong records."
coverImage: '/assets/images/posts/openclaw-2026-9-8-agent-scoped-onboarding.png'
date: '2026-09-08T08:10:00.000Z'
dateFormatted: September 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-8-agent-scoped-onboarding.png'
---

OpenClaw's onboarding recommendation commands now support explicit agent selection. [PR #141775](https://github.com/openclaw/openclaw/pull/141775), "fix(onboard): scope recommendations by agent," merged on September 8, 2026 at 07:24 UTC.

The bug was small from the command line but important for multi-agent setups. The CLI told operators to pass `--agent <id>` when workspace selection was ambiguous, but the command did not actually accept that option.

With the fix, recommendation reads and mutations can be directed at the intended configured agent workspace instead of falling back through ambiguity.

## What Changed

The shared agent selector is now wired into onboarding recommendation commands. The PR says OpenClaw resolves the selected agent's configured workspace before reading, acknowledging, retrying, or clearing an existing recommendation record.

Explicit input is preserved through command registration. Blank IDs are rejected before store access, unknown IDs keep the `openclaw agents list` guidance, and omitted selection keeps the existing default behavior.

That matters because recommendation records are workspace-keyed rows in a shared database. They are not separate files that naturally isolate themselves by agent name.

## Why It Matters

OpenClaw is increasingly used with multiple configured agents: writers, analysts, device-specific helpers, work agents, and personal assistants. Onboarding recommendations can include suggested official plugins or ClawHub skills, so the target workspace matters.

If a command asks for `--agent writer`, it should never silently inspect or mutate the analyst workspace. The PR closes that gap by validating the selector up front and keeping mutations scoped to the chosen workspace.

The fix is also useful for automation. A script that acknowledges or retries recommendations can now name the agent it means, and invalid selectors fail before legacy cleanup or store mutation can run.

## User Impact

Operators can use commands such as `openclaw onboard recommendations --agent writer --json` to inspect a specific agent's recommendation set. The PR includes before-and-after CLI proof showing that the option previously failed as unrecognized and now returns the selected workspace's records.

The same selection path applies to read, acknowledge, retry, refresh, and clear flows. Follow-up reads in the PR confirmed that mutations persisted only where intended.

For single-agent setups, the old unselected default behavior remains. The change is most visible when multiple configured workspaces share the same canonical store.

## Validation

The PR reports real CLI proof with two isolated configured agents, `writer` and `analyst`, each with distinct workspaces and seeded records in the canonical store.

All 116 focused tests passed, including invalid-selector cases, empty-selector registration, safe install-ID filtering, selected legacy cleanup, parent-option rejection, structured JSON errors, ambiguous omission, and the unambiguous default.

The maintainers also retained 47 complete CLI captures with no observable-clause failures. The final review cited in the PR was clean at P0 through P2.
