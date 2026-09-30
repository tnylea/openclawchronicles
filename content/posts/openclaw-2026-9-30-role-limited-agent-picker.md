---
title: "OpenClaw Hides Private Agents from Role-Limited Users"
excerpt: "OpenClaw PR #161019 fixes the Control UI picker so users only see agents allowed by their current role and live discovery state."
coverImage: '/assets/images/posts/openclaw-2026-9-30-role-limited-agent-picker.png'
date: '2026-09-30T23:01:00.000Z'
dateFormatted: September 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-30-role-limited-agent-picker.png'
---

OpenClaw has closed a privacy gap in the Control UI agent picker. [PR #161019](https://github.com/openclaw/openclaw/pull/161019), merged just before the Wednesday nightly cutoff, fixes private agents appearing in the picker and agent directory when a signed-in user's role only allows a subset of agents.

The visible result is straightforward: users discover only the agents their role permits. Owners and roles with `agents: "*"` still see the full roster, while restricted users see the allowed subset. Empty allowlists now clear the selection instead of leaving an old agent identity around.

## The Bug Was About Discovery, Not Execution

The PR is careful to distinguish discovery from authorization. Existing session and run authorization already stayed enforced. The problem was that the UI could show agent roster entries that the operator should not discover.

That still matters. In multi-user agent systems, the name or existence of an agent can be sensitive. A private support agent, finance workflow, customer-specific assistant, or internal automation bot should not show up in a picker merely because a browser had a cached roster.

OpenClaw now filters `agents.list` using the current operator role after asynchronous preparation. It also reconciles the current UI selection against the returned roster, so a saved forbidden selection falls back to an allowed agent instead of lingering.

## Live Rosters Replace Cached Assumptions

The deeper fix removes the cached discovery fallback for new-session catalog targets. Reloads and reconnects now wait for current discovery instead of showing an older browser roster or remembered picker identity.

That design has a tradeoff: the picker and agent directory may wait for live discovery after reload or reconnect. But that wait is preferable to exposing stale private entries. Cached conversation content, groups, transcripts, and draft intent remain available, while the roster itself waits for current authorization.

The PR also handles reconnect drafts in the settings editor. If discovery disappears during reconnect, OpenClaw preserves an unsaved identity draft privately and restores it only when current discovery re-admits the same agent for the same profile and selection intent. Source changes, profile changes, or newer selections discard the draft.

## What Users Should Notice

Restricted users should see a quieter, more accurate interface:

- Old boot records no longer reveal private agents while discovery is pending.
- A narrowed role after reconnect cannot restore a broader roster.
- Empty allowlists produce no selectable agents.
- Successful current discovery selects and displays the allowed agent.
- Unsaved settings edits survive eligible reconnects without granting write access.

For administrators, the important point is that UI discovery now better matches role policy. The Gateway remains the authority, and the browser does not get to fill gaps with stale local knowledge.

## Evidence Behind the Merge

The PR includes real isolated Gateway and Control UI evidence with synthetic accounts. A restricted guest allowed only the `shared` agent received only that agent, while an owner received the full roster and an empty allowlist returned no agents. Gateway regressions moved from failing to passing, and the UI selection suite covered forbidden saved selections and empty loaded rosters.

Additional browser lifecycle tests covered bootstrap cache behavior, failed refresh states, narrowed reconnects, and interrupted settings saves. The final validation included repository guards, test and UI type checks, lint, formatting, dead-export scans, stylelint, and review through P0 to P2.

For OpenClaw teams using role-based access, this is a meaningful privacy and correctness fix. The picker now waits for live permission truth instead of trusting yesterday's roster.
