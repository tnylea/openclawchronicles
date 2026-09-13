---
title: "OpenClaw Adds File Tabs and HTML Preview"
excerpt: "OpenClaw file previews now open in retained tabs, with isolated HTML preview support for attachments and workspace files."
coverImage: '/assets/images/posts/openclaw-2026-9-13-file-tabs-html-preview.png'
date: '2026-09-13T08:02:00.000Z'
dateFormatted: September 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-13-file-tabs-html-preview.png'
---

OpenClaw's workspace preview experience took a useful step forward this morning. [PR #146672](https://github.com/openclaw/openclaw/pull/146672), `feat(ui): keep file previews in tabs and render HTML`, changes file previews from a single replace-in-place panel into retained tabs alongside Terminal and Browser.

It also adds isolated HTML preview support for file tabs and attachments, giving users a much better way to inspect generated pages, reports, mockups, and other local HTML artifacts without leaving the OpenClaw interface.

## What Users Get

The new behavior is built around named file tabs in the existing shared strip. Opening a second file no longer wipes out the first preview. Each tab can retain its view, scroll position, and editor state while users move between files.

The feature includes several practical details:

- File tabs sit alongside Terminal and Browser.
- Equivalent file paths reuse the same tab.
- Explicit line links still navigate correctly.
- HTML files support Preview and Source modes.
- Unsaved edits can be previewed.
- Closing a tab does not save or delete the file.
- Tabs are transient across reconnects and pane teardown.

That should make a daily OpenClaw workflow feel less interruptive. When an agent opens a log, a diff, a generated HTML report, and a source file, the user can move among them without rebuilding context every time.

## HTML Preview, With Boundaries

The HTML preview support is the most interesting piece. Generated HTML is common in agent workflows: dashboards, one-off reports, documentation previews, visual experiments, test fixtures, and tiny internal tools all show up as local files.

OpenClaw now renders those files through the existing isolated sandbox. The PR says strict mode is honored, the existing 256 KiB preview limit remains, and file HTML does not receive widget prompt, wake, dashboard, or tool-bridge access.

That boundary is important. Rendering local HTML is convenient, but it must not become a shortcut around OpenClaw's normal authority model. The PR is labeled with a security-boundary merge risk, and the implementation keeps the preview read-only and sandboxed.

## Why It Matters

This is a workflow feature, not just a UI polish pass. OpenClaw users spend a lot of time inspecting files produced by agents, tools, and background jobs. Retained tabs reduce churn, while rendered HTML makes visual outputs inspectable in place.

It also brings the file panel closer to how developers already think: a tabbed workspace where source, previews, and generated artifacts can stay open while the conversation continues.

## Verification

The PR reports real isolated Gateway and Chromium proof covering HTML, CSS, inline JavaScript, parent-origin isolation, strict mode, Preview and Source switching, retained counter and scroll state, unsaved-edit previews, and byte-identical original downloads.

It also passed integrated browser tests for file-alias reuse and editor recovery, focused Canvas and sidebar tests, Chromium editor regressions, and a full runtime/UI build with public SDK export checks.

For users who ask OpenClaw to build and inspect artifacts in the same turn, this should feel immediately nicer: more tabs, fewer lost previews, and safer in-app HTML rendering.
