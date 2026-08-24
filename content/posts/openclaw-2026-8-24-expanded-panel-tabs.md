---
title: "OpenClaw Keeps Expanded Panel Tabs Clickable"
excerpt: "OpenClaw PR #128262 fixes a Control UI layout bug where shell controls could cover expanded side-panel tabs and actions."
coverImage: '/assets/images/posts/openclaw-2026-8-24-expanded-panel-tabs.png'
date: '2026-08-24T23:02:00.000Z'
dateFormatted: August 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-24-expanded-panel-tabs.png'
---

OpenClaw merged [PR #128262, "fix(ui): keep expanded panel tabs clear of shell controls"](https://github.com/openclaw/openclaw/pull/128262), a P1 Control UI fix for expanded chat side panels.

The reported issue was visual but operationally annoying: when a chat side panel expanded into the first content row, fixed shell controls could render over the panel's tab strip. That meant the sidebar toggle, search button, and optional status controls could cover the active tab, close action, or new-tab control.

In a dense operations interface, clickable geometry matters. A tab strip that looks present but is partially blocked creates a confusing failure mode: users can see what they want to do, but the shell intercepts the interaction.

## What Changed

The repair gives the shell layout one shared physical safe edge for the first content row. Optional controls now contribute their width to that edge, and the content surface occupying the row consumes the same value.

The PR calls out several states covered by the same geometry contract:

- ordinary desktop shell controls
- collapsed navigation and new-session controls
- limited-access and Custodian controls
- Inbox and update attention affordances
- native macOS and hosted web-titlebar chrome
- mobile limited-access action placement

That shared ownership matters because the bug came from a layout matrix that had to account for too many host-specific and state-specific offsets. The fix moves the invariant into the shell instead of asking each panel variant to guess around the controls.

## Why It Matters

OpenClaw's Control UI has become a multi-surface workspace: chat, side panels, session navigation, native host chrome, limited-access states, update indicators, and more can all appear together. As those surfaces grow, fixed padding values become fragile.

PR #128262 is a good example of layout hardening rather than just visual polish. The after-state is not "move this one tab." It is "define the edge once, then let the surfaces share it."

For users, the practical improvements are direct:

- Expanded side-panel tabs remain readable.
- Close and new-tab controls stay clickable.
- Navigation and optional shell controls remain available.
- The panel still occupies the intended content region without a large blank gutter.

## Evidence

The PR includes before-and-after screenshots from the real Control UI shell and side-panel DOM. The author highlights dark theme, collapsed navigation, optional controls, limited-access light theme, mobile limited-access, and native 620px titlebar states.

Validation included 22 Chromium E2E checks for side-panel clearance and native navigation behavior, another 42 UI E2E checks across navigation and device/update flows, focused browser component tests, `pnpm ui:build`, `pnpm build`, and `node scripts/check-changed.mjs`.

The production diff is almost neutral: the PR reports net minus three production lines while adding targeted coverage for the states that made the original offset approach brittle.

## Bottom Line

PR #128262 makes expanded panel navigation feel dependable again.

The interesting part is not that OpenClaw moved a tab out from under a button. It is that Control UI now has a shared layout contract for the top row, which should make future shell controls less likely to collide with the work surface.
