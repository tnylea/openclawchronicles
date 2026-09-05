---
title: "OpenClaw Dashboards Get Native Data Reports"
excerpt: "OpenClaw dashboards can now render native reports with metrics, tables, charts, and links, avoiding iframe overhead for routine structured data views."
coverImage: '/assets/images/posts/openclaw-2026-9-5-native-dashboard-reports.png'
date: '2026-09-05T23:10:00.000Z'
dateFormatted: September 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-5-native-dashboard-reports.png'
---

OpenClaw has merged a dashboard feature aimed at a common agent workflow: publishing structured reports without turning every report into a mini web app. [PR #139306](https://github.com/openclaw/openclaw/pull/139306), "feat: render dashboard data reports without iframes," landed on September 5, 2026 at 20:30 UTC.

Before this change, dashboard reports generally needed an HTML document and sandboxed frames, even when the content was passive: text, metrics, a table, a chart, and a few links. That pushed agents toward generated HTML for cases that did not need script execution or a document sandbox.

The new path adds a bounded `session:report` widget rendered directly by the Control UI.

## What Changed

The PR adds structured report support to `show_widget`, including `pin: true`, and lets dashboard code create or update it through the existing `widget_put` operation. The supported content set is intentionally focused:

- text
- metrics
- tables
- bar charts
- line charts
- HTTP and HTTPS links

The same validator protects both writes and rendering, and fixed Lit components own the markup and styling. That means an agent can refresh report data without loading a new document, asking for an inline preview grant, or spinning up an iframe.

The limit is also explicit. Report props stay inside the existing 8 KiB widget props limit, which keeps the feature shaped for compact operational reports rather than arbitrary document publishing.

## Why It Matters

Dashboards have become one of OpenClaw's most important surfaces because agents increasingly hand back state, not just prose. A build monitor, inbox triage run, deployment summary, sales tracker, or research sweep often wants to show a small set of metrics and a table of evidence.

HTML still makes sense when a report needs custom interaction or rich layout. But for ordinary data summaries, native reports reduce the amount of generated code in the loop. They also keep passive content inside known Control UI components instead of giving every report its own frame.

The PR preserves existing dashboard behavior. HTML reports, registered source kinds, MCP apps, plugin source kinds named `report`, and live progress widgets keep their rendering and authority boundaries. Existing saved HTML reports are not automatically converted.

## Performance Claims Stay Narrow

The evidence section is careful about performance. It says native reports consistently remove two iframe contexts and can update saved report data without loading another document, but it does not claim a general first-load speedup.

The measured desktop navigation median was slightly faster for native reports, while mobile navigation was slower in that particular batch. Board-stage updates were stronger: native was faster in most mobile pairs, with a reported 175 ms median mobile board-stage saving.

That restraint is useful. The feature is primarily about choosing the right rendering primitive for bounded data. Any startup performance win depends on the broader dashboard path.

## Validation

The PR includes broad UI and production-bundle coverage. After rebase, 177 focused UI cases passed across 12 files, followed by production-bundle E2E coverage for native report desktop and mobile rendering plus progress widgets. The report update path preserves the element and does not load an additional document.

The patch also removed old mock dashboard runtime pieces, reused existing lazy custom-element and session-progress controllers, and reduced production TypeScript/CSS overall. Including generated metadata, production code moved by a net negative line count.

For OpenClaw operators, the practical effect is simple: agents can publish crisp dashboard reports for routine structured data without making the browser host a generated HTML app every time.
