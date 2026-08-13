---
title: "OpenClaw Protects Sessions From Eviction Caps"
excerpt: "OpenClaw now excludes protected sessions from ordinary history eviction caps, preserving recent dashboard and subagent runs under pressure."
coverImage: '/assets/images/posts/openclaw-2026-8-13-protected-session-eviction.png'
date: '2026-08-13T08:04:00.000Z'
dateFormatted: August 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-13-protected-session-eviction.png'
---

OpenClaw merged a session-history reliability fix that should matter most to busy, long-lived installations. [PR #123014](https://github.com/openclaw/openclaw/pull/123014), titled "fix(sessions): exclude protected sessions from entry cap," changes how OpenClaw counts sessions during maintenance so protected entries do not crowd ordinary sessions out of the store.

The bug was subtle but painful. OpenClaw has a default session-entry cap. Some sessions, however, are not safe for routine cleanup: active runs, locked sessions, archived sessions, channel sessions, and other protected records can be immune from ordinary eviction. Before this change, those protected entries still consumed the ordinary-session allowance even though maintenance could not delete them.

That meant a store near the default cap could end up deleting recent dashboard or subagent sessions simply because protected history had filled the quota.

## What Changed

The new maintenance logic builds one eviction-eligible set and applies the cap only to that set. Protected sessions remain outside the ordinary allowance. OpenClaw keeps the newest eligible sessions, while protected sessions are preserved for the reasons that made them protected in the first place.

The PR applies the same accounting rule across the affected maintenance paths:

- Active-session warnings
- File-backed cleanup behavior
- Cleanup preview output
- SQLite write-triggered enforcement

For SQLite-backed state, the implementation reads and parses `session_nodes` once per enforcement check. It derives the protected-key set, eligible count, and stale-candidate decision from that snapshot, then reuses the snapshot if cleanup runs. That keeps the fix focused on ownership and accounting rather than adding another count query or widening the Plugin SDK surface.

## Why It Matters

Session history is one of those systems users notice only when it fails. If a dashboard session disappears too early, a subagent result is missing, or a recent run becomes hard to inspect, the product feels unreliable even if the underlying model work succeeded.

This fix separates two different ideas that had become tangled:

- Whether a session is protected from maintenance
- Whether a session should count against the ordinary eviction budget

Protected sessions still need preservation, but they should not make ordinary recent sessions look old. That is the core correction.

## Relation To Pinned Sessions

The PR notes that pinned-session immunity is handled separately by merged [PR #122990](https://github.com/openclaw/openclaw/pull/122990). This branch was rebased over that fix and covers the combined preservation and quota behavior.

That distinction is useful. OpenClaw now has clearer rules for multiple kinds of session retention: pinned entries, protected entries, and ordinary entries each keep their own role instead of blurring into one cap.

## Verification

The PR includes regression coverage for protected session preservation, ordinary eviction, preview behavior, SQLite enforcement, and the combined pinned-session path. It was labeled as a high-priority user-facing bug with availability risk, which fits the failure mode: history cleanup should never delete useful recent work just because undeletable records are sitting nearby.

## The Bottom Line

[PR #123014](https://github.com/openclaw/openclaw/pull/123014) is a cleanup fix with real operator impact. OpenClaw installations that accumulate active, archived, locked, channel, or otherwise protected sessions should now retain recent ordinary sessions more predictably under the history cap.
