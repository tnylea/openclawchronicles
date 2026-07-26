---
title: "OpenClaw Adds Path-Based Session URLs"
excerpt: "OpenClaw Control UI now supports readable chat and dashboard paths, making session links bookmarkable without exposing internal session keys."
coverImage: '/assets/images/posts/openclaw-2026-7-26-path-session-urls.png'
date: '2026-07-26T23:01:00.000Z'
dateFormatted: July 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-26-path-session-urls.png'
---

OpenClaw Control UI links are getting much easier to read and share. [PR #113883](https://github.com/openclaw/openclaw/pull/113883), merged July 26, replaces opaque query-string session links with path-based chat and dashboard routes.

The old form put the full internal key into a `?session=` query parameter. That made URLs noisy, forced colon-delimited keys through percent encoding, and exposed a session-key grammar as a user-facing link contract. Dashboard view state also lived separately, so shared links could not reliably express which face of a session someone intended to open.

## What Changed

The new routes use readable paths for both chat and dashboard views:

- `/chat/main/deploy-monitor-6db92d48`
- `/dashboard/main/deploy-monitor-6db92d48`
- `/dashboard/6db92d48`
- `/chat/main`
- `/chat/main/telegram/12345`

OpenClaw now treats the board face as a route namespace instead of a query modifier. Released query-style links are still accepted at the application boundary, then replaced with the canonical path.

That means old shared links should not break, but new links become cleaner and easier to recognize.

## Anchored To The Right Identity

The PR makes one particularly important design choice: URLs are anchored on the session key, not the rotating `sessionId`.

That matters because OpenClaw can reassign `sessionId` during compaction or reset. A bookmark tied to that value would become stale after routine lifecycle work. The session key is the stable identity, and dashboard sessions keep their trailing opaque UUID separate from the rotating runtime id.

For UUID-backed sessions, Control UI can resolve a short prefix through the existing `sessions.list` search path. For non-UUID shapes such as channels, peers, and cron sessions, the literal path segments reconstruct the key directly.

## Better Sharing, Fewer Hidden Assumptions

The change also documents which parts of a URL are stable identity and which parts are decorative.

In short-id links, agent and slug segments can be corrected by the app if they are stale. In literal-form links, the agent segment is part of the reconstructed session key and remains authoritative. That split is now captured in docs instead of being implied by implementation details.

For operators and teams using Control UI throughout the day, this is a practical workflow improvement. Links to sessions, dashboards, and specific work views become easier to paste into notes, issues, chat threads, and handoff messages.

## Verification

The PR reports broad automated coverage across UI routing, session URL contracts, ClickClack link compatibility, shell active-session sync, released query-link migration, literal and escaped key round trips, decorative-segment tolerance, canonical rewriting, bounded prefix pagination, and session-id rotation independence.

The author also calls out a limitation: no source-blind live browser validation was performed against a gateway fixture with both catalog data and a non-default main key. That caveat is worth noting, but the regression coverage targets the major contract risks directly.

This is the kind of small surface polish that compounds. OpenClaw sessions are long-running workspaces, and long-running workspaces need links that can survive sharing, bookmarking, compaction, and coming back later.
