---
title: "OpenClaw Control UI Gets a Session-First Sidebar"
excerpt: "OpenClaw's Control UI now centers sessions in the sidebar, adds a compact context ring, and softens the default light theme."
coverImage: '/assets/images/posts/openclaw-2026-7-3-control-ui-sidebar.png'
date: '2026-07-03T08:01:00.000Z'
dateFormatted: July 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-3-control-ui-sidebar.png'
---

OpenClaw merged [PR #99289, "feat: session-first sidebar, compact context ring, and warm light theme for the Control UI"](https://github.com/openclaw/openclaw/pull/99289) just before the July 3rd morning scan, shipping a substantial usability pass for the web Control UI.

The change targets one of the most repeated operator actions: finding, switching, and returning to active sessions. Before the merge, the PR says session switching was buried under a 14-tab page nav, a small dropdown, and a recents list that could stay empty on a cold `/chat` load.

That is a sharp pain point for a product built around long-running agents. If the user cannot quickly see which session is live, which session is recent, and how much context is left, the interface adds friction to every follow-up.

## What Changed

The expanded sidebar now treats sessions as the main chat entry point. It shows a `+ New session` action, a ten-row recent session list, a compact session search button, and an `All sessions` path. The current session can stay pinned above recents, even when lists are capped, filtered, archived, or otherwise replaced.

The PR also moves the full session picker behind search and makes cold chat entry hydrate sessions in the background. That background load is deliberately scoped so a stale session-list snapshot cannot clear live stream state or disable the New Session action.

The old chat nav group is removed from the expanded sidebar because, in the new model, the session list is chat. The collapsed rail keeps its icon for compact navigation.

## Context Moves Into the Composer

Context usage also gets a smaller, more local home. Instead of occupying a full-width pill above the composer, usage becomes a compact ring and percentage near the send control, with fuller detail available in a tooltip.

That makes the signal easier to scan without forcing context pressure to dominate the conversation surface. The PR notes that the compact button still appears when pressure is high, so the warning path remains visible when it matters.

## A Calmer Light Theme

PR #99289 also adjusts the default light palette from cool gray and alarm red toward warm paper, warm gray borders, and a terracotta accent. The PR reports accessibility checks for the new accent and text contrast, including a 4.9:1 accent-on-background ratio and stronger contrast for primary text.

Smaller refinements round out the release: the sidebar brand drops the `CONTROL` eyebrow, breadcrumbs stop repeating `OpenClaw › OpenClaw` when the agent is named OpenClaw, settings becomes an icon-only chip, and the send button becomes a filled circle.

## Why It Matters

This is not just visual polish. It changes the information architecture around the unit operators touch most often: the session.

For teams running multiple agents, the sidebar keeps an agent filter in the sessions section. For single-agent installs, that filter stays out of the way. The provider quota pill also moves into the sidebar footer so it remains available outside the chat tab.

The PR body says the change removes the old sidebar dropdown select, `sessionSwitcherOnly` and `compact` picker variants, and unused sidebar-search CSS, while ending at a net reduction of 64 lines overall after generated i18n changes.

## Evidence

The PR includes before-and-after screenshots for light and dark mode, plus a published artifact manifest. Its test evidence covers `pnpm tsgo:test:ui`, unit and browser suites, mocked-gateway E2E coverage for chat flow, picker pagination, search, the quota pill, background hydration, and the pinned active row.

Codex autoreview also ran multiple passes, with the final pass reporting no accepted actionable findings.

## Bottom Line

OpenClaw's Control UI is moving toward a session-first operating surface: fewer buried controls, more visible recents, clearer context pressure, and a lighter default visual tone.

For daily operators, that should make the web UI feel less like a settings dashboard and more like an agent workspace.
