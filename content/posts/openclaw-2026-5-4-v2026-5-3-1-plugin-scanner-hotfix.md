---
title: "OpenClaw v2026.5.3-1: Plugin Scanner Hotfix for Bundled Packages"
excerpt: "OpenClaw v2026.5.3-1 hotfix resolves a plugin scanner false positive that blocked official bundled packages from installing correctly."
coverImage: '/assets/images/posts/openclaw-2026-5-4-v2026-5-3-1-plugin-scanner-hotfix.png'
date: '2026-05-04T14:00:00.000Z'
dateFormatted: May 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-4-v2026-5-3-1-plugin-scanner-hotfix.png'
---

A few hours after v2026.5.3 landed this morning, a regression surfaced in the plugin install scanner. OpenClaw v2026.5.3-1 is out now (09:35 UTC) with a targeted fix.

## What Broke

The plugin security scanner checks packages before installation to catch risky patterns — `process.env` access, suspicious API calls, that kind of thing. In v2026.5.3, the scanner was triggering false positives on **official bundled plugin packages**.

The problem: when `process.env` access and normal API sends appeared in **distant parts of the same compiled bundle**, the scanner flagged the package as suspicious — even when both patterns were completely legitimate. Bundled plugins compile multiple modules together, and the scanner was treating the overall bundle as a single unit rather than accounting for module boundaries.

The result: users who tried to install or reinstall official bundled plugins would hit an unexpected block. Not a good experience right after a major stable release.

## What the Fix Does

The scanner logic has been updated to handle compiled bundles correctly — specifically, to stop conflating legitimate patterns that happen to coexist in a bundle's output. Official packages are no longer blocked by this false positive.

The security intent of the scanner is unchanged. It still catches what it's supposed to catch. It just no longer fires on your own first-party plugins.

## Who's Affected

If you upgraded to v2026.5.3 today and ran into issues installing or re-installing bundled plugins, this is your fix. Anyone on earlier versions is also encouraged to upgrade directly to v2026.5.3-1.

## How to Upgrade

```bash
openclaw upgrade
```

The `openclaw@2026.5.3-1` package is now published on the beta dist-tag and will roll into the stable channel shortly.

Release notes: [v2026.5.3-1 on GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.3-1)
