---
title: "OpenClaw Control UI Stops Repeated Avatar Misses"
excerpt: "OpenClaw PR #168640 consolidates profile avatar availability so missing user and workspace images stop causing repeated failed requests on reload."
coverImage: '/assets/images/posts/openclaw-2026-10-11-control-ui-avatar-misses.png'
date: '2026-10-11T23:02:00.000Z'
dateFormatted: October 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-11-control-ui-avatar-misses.png'
---

OpenClaw merged [PR #168640](https://github.com/openclaw/openclaw/pull/168640), a Control UI performance fix for a small but noisy problem: repeated missing avatar and workspace icon requests on signed-in dashboard reloads.

The PR introduces a shared `ProfileDirectory` owner for user profile data in the Control UI. Instead of each consumer guessing whether an avatar might exist, the directory supplies avatar availability to mentions, owner chips, menus, and author avatars.

## The Problem

The PR describes a signed-in dashboard deep-link reload that repeatedly requested missing avatars and icons. A synthetic reload measurement recorded about ten user-avatar 404s plus an agent-avatar and workspace-icon 404 per reload.

Those misses are not catastrophic, but they add avoidable noise. They also make the UI do work for images the app already knows are absent.

The tricky part is preserving real profile photos. The UI needs to avoid speculative misses without hiding actual user images when profile data arrives later.

## The Fix

`ProfileDirectory` becomes the Gateway-scoped owner of `users.list` in the Control UI. It coalesces reads, follows canonical profile merges, retires stale scopes, and refreshes person cards when opened.

Profiles with uploaded avatars render through versioned avatar URLs. Profiles without avatars render initials and do not issue speculative image requests. Definite misses are cached privately for a short window, while stale or unversioned requests and transient failures are not cached.

The PR also keeps agent identity and workspace icon behavior scoped: hydrated agent identity owns avatar absence, and workspace misses are cached only after resolving the workspace root.

## User Impact

For users, this should mostly feel like absence of friction. Menus, mentions, owner chips, and author avatars still show the right identity state, but reloads should stop hammering missing image URLs.

The PR body includes screenshot-backed proof for mention behavior: no image requests while availability is unknown, one successful versioned photo request when a photo is advertised, and no requests for absent avatars. It also verifies that chip geometry stays stable across desktop and mobile-like widths.

That last detail matters. A performance fix that shifts labels or chips around would trade one polish issue for another. This one is scoped to request behavior and profile-directory ownership.

## Why It Matters

This is not a headline feature, but it is a good example of Control UI maturation. The app is increasingly treating profile, presence, and avatar data as shared state with a real owner rather than as repeated local fetch guesses.

The immediate benefit is fewer failed requests. The longer-term benefit is a cleaner identity layer for the web UI: one directory, clearer availability signals, and less duplicated profile plumbing across Lit and Solid consumers.
