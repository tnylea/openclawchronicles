---
title: "OpenClaw Android Adds App Consent Gate"
excerpt: "OpenClaw Android now requires a prominent installed-apps disclosure before sharing phone app inventory with a paired Gateway."
coverImage: '/assets/images/posts/openclaw-2026-7-11-android-installed-apps-consent.png'
date: '2026-07-11T23:01:00.000Z'
dateFormatted: July 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-11-android-installed-apps-consent.png'
---

OpenClaw's Android app now requires explicit installed-apps consent before sharing a phone's application inventory with a paired Gateway. The change landed in [PR #97888](https://github.com/openclaw/openclaw/pull/97888), a P1 privacy and release-compliance fix merged late Saturday.

The issue was concrete: Google Play rejected Android app bundle `2026060901` because installed application information was uploaded without a prominent disclosure. OpenClaw's fix moves the permission into the normal Phone Capabilities settings flow and makes the disclosure feature-specific.

## What Changed

When a user tries to enable Installed Apps, Android now shows a disclosure dialog before the feature turns on. The affirmative path is explicit: the user must tap `Allow Installed Apps`. Dismissing the dialog, pressing Back, or choosing `Not Now` leaves the feature disabled.

Existing installs are treated conservatively. If a device already had `device.apps.sharing.enabled=true` before this disclosure version, the updated app loads the feature as disabled until the user accepts the current disclosure. That prevents old preference state from silently bypassing the new consent version.

The PR also says the change does not broaden Android package visibility or add `QUERY_ALL_PACKAGES`. That is an important boundary: this is not a wider app-scanning permission grab wrapped in a better dialog. It is a gate around an existing capability.

## Why Operators Should Care

Installed app inventory can be useful for a personal agent. It helps a Gateway understand what tools, messaging clients, and local workflows may exist on the phone. But app names, package IDs, and app status are still sensitive context. They can reveal banking apps, medical apps, work tools, or personal habits.

The new disclosure says that data is shared with the user's own OpenClaw Gateway rather than an OpenClaw-operated server, and that the user-managed Gateway controls any later model-provider use. That distinction is useful, but it does not remove the need for informed consent. The phone is still handing local device context to an agent system.

## Release Pipeline Follow-Through

The Android Fastlane release flow now includes an explicit Google Play Data Safety CSV lane and an opt-in release-upload hook. That gives maintainers a repeatable path for reviewed Play Console declarations instead of relying on manual release notes and memory.

The evidence list is unusually thorough for a consent fix: unit tests, ktlint, Android release gate tests, version checks, Fastfile syntax validation, Data Safety validation in Google Play validate-only mode, and live emulator checks for fresh opt-in, dismissal, Back behavior, consent persistence, and post-update disabled state.

For users, the practical result is simple: Installed Apps stays off until the current app shows the disclosure and receives an affirmative yes.
