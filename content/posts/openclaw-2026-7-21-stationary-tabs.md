---
title: "OpenClaw Stabilizes Threads And Worktrees Tabs"
excerpt: "OpenClaw now keeps Threads and Worktrees page tabs stationary, improving route switching, keyboard focus, and constrained layouts."
coverImage: '/assets/images/posts/openclaw-2026-7-21-stationary-tabs.png'
date: '2026-07-21T08:03:00.000Z'
dateFormatted: July 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-21-stationary-tabs.png'
---

OpenClaw merged a Control UI polish fix this morning that should make the Sessions area feel steadier. [PR #112039](https://github.com/openclaw/openclaw/pull/112039), titled "fix(ui): keep Threads and Worktrees tabs stationary," fixes a visible jump when users switch between the Threads and Worktrees routes.

The bug came from the two routes rendering different numbers of header controls. Because the page-level tab strip was anchored inside those differing layouts, the tabs could shift horizontally during navigation. That kind of motion is small, but in a tool used repeatedly through the day, it makes the interface feel less settled.

## What Changed

Threads, Worktrees, and the Plugins route hub now share a neutral page-hub tab renderer. That shared renderer owns the markup, manual activation behavior, accessibility wiring, styling, and keyboard focus handoff for this kind of top-level page navigation.

The Sessions hub header also now uses stable outer layout slots. For constrained desktop widths, it has a two-row fallback so the selector and tabs do not overlap. The existing mobile header behavior remains intact.

The PR intentionally avoids converting every tab-like control in the product. Segmented filters, detail tabs, board tabs, and closeable workspace tabs keep their specialized components because they have different semantics and interaction contracts.

## Why It Matters

OpenClaw's Control UI is becoming a dense operating surface: sessions, worktrees, plugins, terminals, agents, and route-specific controls all live near each other. Stability in the header is not just visual polish. It helps users build muscle memory.

When the tab strip stays in the same place, route switching is easier to scan. Keyboard users also benefit because focus can be retained across the route swap instead of being thrown into a subtly different layout.

This is the kind of frontend fix that usually does not need a release headline, but it matters for a daily driver. Less shifting means less friction.

## Proof From The PR

The PR includes before-and-after Chromium screenshots for desktop and constrained desktop widths, plus sanitized proof assets for inspection. The user impact section states that Threads and Worktrees now keep the switcher in the same horizontal position, keyboard navigation retains focus, constrained desktop widths avoid overlap, and mobile continues to hide the page header.

Validation included focused Plugins and Sessions hub suites with 46 tests passing, Chromium layout regression checks at 1280px, 820px, and 414px, and `pnpm check:changed` passing with formatting, UI i18n verification, UI and core-test typechecks, and lint. The author also reports a clean Codex autoreview and `git diff --check`.

For users, the takeaway is simple: switching between Threads and Worktrees should now feel anchored instead of twitchy.
