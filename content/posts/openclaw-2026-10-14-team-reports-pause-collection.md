---
title: "OpenClaw Team Reports Can Pause Auto Collection"
excerpt: "OpenClaw Team Reports gained a schedule switch that pauses automatic collection while keeping stored reports, session views, and manual generation available."
coverImage: '/assets/images/posts/openclaw-2026-10-14-team-reports-pause-collection.png'
date: '2026-10-14T08:10:00.000Z'
dateFormatted: October 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-14-team-reports-pause-collection.png'
---

OpenClaw's Team Reports plugin gained a useful operator control this morning: automatic collection can now be paused without disabling the rest of the reporting surface. [PR #171840](https://github.com/openclaw/openclaw/pull/171840) adds a default-on schedule setting for teams that want stored reports and manual generation to remain available while automatic collection is stopped.

The new setting is:

```yaml
plugins.entries.team-reports.config.schedule.enabled: false
```

When set to `false`, OpenClaw stops timer-based collection and catch-up admission. Stored reports, work-session views, and explicit manual day, week, or month generation continue to work.

## Why This Control Was Needed

Before this patch, operators could disable intraday runs, but daily collection and catch-up behavior could still continue. That made it awkward to pause automatic Team Reports cleanly.

There are plenty of legitimate reasons to pause collection:

- A team is auditing reporting scope or credentials
- A workspace wants to reduce scheduled background work temporarily
- A plugin owner wants to preserve reports while changing retention or configuration
- An installation needs manual-only reporting during a migration window

The key distinction is that pausing collection should not make historical reports disappear, and it should not block an explicit manual report.

## What OpenClaw Now Reports

The scheduler now owns the automatic-work decision directly. If scheduling is disabled, it skips automatic timer and catch-up admission, while manual runs continue to be accepted.

Status output also reports `scheduleEnabled`, and a disabled schedule has no `nextDue` entries. That gives operators a visible confirmation that automatic collection is off, rather than requiring them to infer it from the absence of future work.

The plugin manifest, configuration parser, README, and configuration guide were updated to describe the same control. The canonical plugin-config budget increases by one for the new default-true automatic-scheduling setting.

## No Data Migration

This is source-only work. The PR says it changes no running Gateway, service configuration, stored reports, or external API data. Existing credentials and retention behavior are unchanged, and scheduling remains enabled by default.

That default is important. Most teams using Team Reports probably expect automatic collection to continue. The new control is for operators who explicitly want a pause state.

## Verification

The regression coverage uses the real scheduler and SQLite store. It checks disabled scheduling across daily, weekly, and monthly rollover and restart paths; verifies that automatic collection and pruning do not run; confirms manual report generation still works; and preserves stored JSON and Markdown reads through registered Gateway methods.

Corrected-head CI passed with config and docs checks, changed-extension tests, production and test types, and lint. The earlier run caught a missing generated baseline, which was fixed before the final pass.

The practical headline is simple: Team Reports now has a proper pause switch. Operators can stop background collection without losing the reporting surface they still need.
