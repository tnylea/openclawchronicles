---
title: "OpenClaw Restores Large Sidebar Rosters"
excerpt: "OpenClaw's session sidebar now keeps large category rosters visible, adding a clearer load-more path for busy team dashboards with many live sessions."
coverImage: '/assets/images/posts/openclaw-2026-8-28-sidebar-roster-sessions.png'
date: '2026-08-28T08:15:00.000Z'
dateFormatted: August 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-28-sidebar-roster-sessions.png'
---

OpenClaw merged a Control UI session-roster fix in PR [#131202](https://github.com/openclaw/openclaw/pull/131202), aimed at teams with enough live sessions and categories to expose sidebar pagination bugs.

The issue showed up as empty headers, missing categories, and no useful way to recover rows whose newest sessions fell outside the first fetched page. On a small local setup, that can be hard to notice. On a busy team instance, it becomes a real navigation problem.

## What Went Wrong

Sidebar sections are seeded from the group catalog, then filled from `sessions.list`. The previous implementation had several overlapping limits: a sidebar query limit, a default session-list query limit, and an owner-first floor. When a category's newest session landed outside that limited page, the category could render with no rows.

With an owner filter active, the UI could hide the empty section entirely. That made the category look like it did not exist, even though the catalog and sessions were still present.

The PR includes a concrete read-only measurement from `team.openclaw.ai`: 28 catalog groups and 184 live sessions, but only 6 of 28 categories had a visible row. One category had 25 live sessions and still rendered empty because its newest session ranked too low by recency.

## The Repair

OpenClaw now uses one sidebar roster page-size define: `SIDEBAR_SESSION_ROSTER_LIMIT = 200`. The roster query, roster default, and Gateway startup prewarm share it, so the warm cache matches what the UI asks for.

The public Gateway contract is not changed. The no-argument `sessions.list()` default remains bounded at 100, preserving the documented CLI and SDK behavior. This is specifically a sidebar roster fix.

Load-more behavior is also clearer. Section-level "Show more" reveals rows already held by the roster. Fetching additional rows is handled by a list-level control shown when the Gateway reports more pages. Because a fetched page may populate any section, that control advances every section by a page so the click does not appear to do nothing.

The PR also removes old catalog write caps around session groups and section order. The read path was already unbounded, and Gateway registration could already grow beyond those limits, so writes needed to stop failing once a large team crossed the old threshold.

## Why Teams Should Care

Session categories are part of how OpenClaw teams keep work organized. If a category disappears under an owner filter or renders as an empty shell, users lose trust in the dashboard even when the underlying state is intact.

This fix makes the sidebar behave more like an operational index: categories show their contents, larger rosters remain reachable, and pagination is visible rather than implicit.

## Verification Notes

The PR reports mocked-Gateway Playwright before-and-after captures, a regression test that fails on the pre-fix build, affected sidebar and Gateway test suites, and timing measurements around the new page size. It also calls out an unrelated local Workboard test failure that was reproduced on the pristine merge-base tree.

For high-activity OpenClaw installations, this should make the Control UI's session sidebar less surprising and more complete.
