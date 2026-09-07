---
title: "OpenClaw Adds Native Mac Browser Tabs"
excerpt: "OpenClaw for macOS now opens links as crisp native Mac tabs inside the Browser panel, replacing the old split sidebar with unified browsing controls for users."
coverImage: '/assets/images/posts/openclaw-2026-9-7-native-mac-browser-tabs.png'
date: '2026-09-07T23:15:00.000Z'
dateFormatted: September 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-7-native-mac-browser-tabs.png'
---

OpenClaw's macOS app now has a cleaner answer for link browsing inside the Control UI. [PR #140988](https://github.com/openclaw/openclaw/pull/140988), "feat(macos): open links as native Mac tabs in the Browser panel," merged on September 7, 2026 at 20:12 UTC.

Before this change, the app had two browser concepts. External links clicked in the dashboard could open in a native WKWebView split-view sidebar, while the Control UI Browser panel showed the Gateway-controlled Chromium browser that agents drive through streamed screenshots.

With this PR, the Browser panel becomes the unified place for both native Mac tabs and agent browser tabs.

## What Changed

The Browser tab in the unified side panel now supports two tab kinds. Mac tabs are real WKWebViews owned by the macOS app and overlaid on the Browser panel's stage. Agent browser tabs keep the existing Gateway browser behavior, including live screencasts.

That split lets user-clicked links feel native and crisp without confusing them with the browser an agent is controlling. A Mac tab never starts or acknowledges a screencast, and switching tab kinds hands the stage between the native view and the streamed browser.

The old split-view sidebar, divider, width memory, and app-side inline link route are removed. Older Control UI bundles that still post the legacy inline route now open the default browser instead.

## User Impact

In the macOS app, links open as native Mac tabs in the Browser panel next to agent browser tabs. The PR says users get a tab strip, URL bar, back, forward, reload, stop, open-in-default-browser, Annotate, and Inspect controls.

Right-clicking a link can offer Open in Browser Panel, Open in Default Browser, or Copy Link. Same-link clicks reuse an existing tab, including the original URL after redirect. Downloads and non-displayable responses hand off to the default browser only for user-activated main-frame navigation.

The app also hides the Open links in Control UI browser preference because macOS links now open as Mac tabs there. If Settings owns the viewport, a clicked link opens in the default browser instead of an invisible dock.

## Why It Matters

The old arrangement made sense historically, but it mixed two very different jobs. Users reading ordinary links want a native browser. Agents need the Gateway-controlled browser surface they can observe and operate.

Putting both into one Browser panel makes the app easier to reason about. Users can keep reading tabs alive across chat session switches, while agent browser tabs still preserve the live automation surface.

It also improves visual quality for ordinary reading. The PR specifically contrasts native WKWebView tabs with remote browser content that could arrive as a blurry, polled image inside the app.

## Validation

The PR includes a live run on a Developer ID signed package against an isolated Gateway. The maintainers verified link clicks opening Mac tabs, command-palette occlusion hiding the native view, Annotate snapshots, context menus, same-link reuse, form interaction inside WebKit, and tab close behavior.

Proof also included Swift builds and tests, native browser contract tests, UI bridge and panel tests, localization verification, browser Inspect script checks, and multiple review passes with accepted findings fixed through regression tests.

For macOS users, the release-note version is concise: OpenClaw link browsing now lives in the Browser panel as native Mac tabs, and the split-view link sidebar is gone.
