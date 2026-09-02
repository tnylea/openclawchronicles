---
title: "OpenClaw Android Settings Now Keeps Refreshes Current"
excerpt: "OpenClaw's Android Settings refresh flow now protects current data, progress, and errors when overlapping requests finish out of order."
coverImage: '/assets/images/posts/openclaw-2026-9-2-android-settings-refresh.png'
date: '2026-09-02T23:00:00.000Z'
dateFormatted: September 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-2-android-settings-refresh.png'
---

OpenClaw's Android app picked up a careful reliability fix today for one of the places where race conditions are most visible: Settings refreshes. PR [#136643](https://github.com/openclaw/openclaw/pull/136643), merged on September 2, fixes overlapping refresh behavior across Android Settings summaries and gives New Chat its own observable progress state.

The short version is simple: when users refresh Settings more than once, an older request should not overwrite the newer result. The merged change makes that rule explicit across Usage, Skills, Channels, Dreaming, and Health & Logs.

## What Changed

The PR says the bug could appear when "users refreshing Android Settings more than once could see a slower, earlier request overwrite newer data, display an obsolete error, or dismiss the newer request's loading indicator." It also notes that cancellation could look like a load failure, which is the kind of UI ambiguity that makes mobile troubleshooting harder than it needs to be.

OpenClaw now gives each settings summary one immutable data, loading, and error state, plus a current request owner. In practical terms, the newest refresh owns what the user sees. Older work can finish, but it cannot take the screen back from the request that replaced it.

That same ownership model matters for ClawHub installs. The PR description calls out that an install verifies its own fetched skills snapshot even if a later Settings refresh owns the displayed list, while still rejecting data from a replaced Gateway.

## Android Impact

For Android users, the visible behavior is calmer:

- Settings pages retain their current data during refresh
- Only the latest overlapping refresh controls progress and errors
- Disconnect clears stale summaries
- Usage keeps its existing bounded background retry behavior
- New Chat shows progress in the sidebar and chat header
- Duplicate New Chat creation is blocked while the first request is pending

The New Chat change is worth calling out separately. Before this PR, New borrowed transcript-loading state, which could leave users without a clear creation signal over an existing conversation. It could also let an older history tail clear progress for a newer operation. The fix gives New its own admission state instead of overloading transcript loading.

## Why This Matters

Settings is where users go when something is already uncertain: an account looks disconnected, a skill install needs verification, logs need checking, or usage details are not clear. A stale refresh result in that context can send people chasing the wrong problem.

This is not a flashy feature, but it tightens the contract around mobile state. The Android app now treats refreshes more like ordered operations with ownership, not as independent responses that all get to update the UI when they return.

## Verification

The PR reports broad Android proof: 5,361 phone tests passed with no failures, errors, or skips; both debug APKs built; Android lint passed; and all six Android CI jobs passed on the corrected head. The final native replay covered New, normal Send, Channels refresh ordering, and a five-page Settings smoke test across Channels, Dreaming, Skills, Usage, and Health logs.

It also documents one follow-up that remains outside this change: initial Settings load failures can still show misleading empty-state copy such as "No channels found" or "No recent log entries." That presentation issue is explicitly not fixed here.

For anyone running OpenClaw on Android, this is the kind of update that should make repeated refreshes, installs, and new-session starts feel less fragile.

---

*PR [#136643](https://github.com/openclaw/openclaw/pull/136643) · merged September 2, 2026 · source: OpenClaw GitHub*
