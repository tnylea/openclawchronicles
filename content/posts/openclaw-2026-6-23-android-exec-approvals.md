---
title: "OpenClaw Adds Android Exec Approval Inbox"
excerpt: "OpenClaw Android now routes gateway-backed exec approvals into the in-app approvals screen, bringing mobile review closer to iOS parity."
coverImage: '/assets/images/posts/openclaw-2026-6-23-android-exec-approvals.png'
date: '2026-06-23T08:01:00.000Z'
dateFormatted: June 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-23-android-exec-approvals.png'
---

OpenClaw merged [PR #95593](https://github.com/openclaw/openclaw/pull/95593), adding a gateway-backed exec approval inbox to the Android app.

Before this change, Android had stable gateway operator identity and approval scopes, but the in-app Approvals screen only reflected active chat pending tool calls. Exec approval requests routed through the gateway were not consistently listed, refreshed, resolved, or handled from connected Android clients.

That left Android behind iOS for one of OpenClaw's most important human-in-the-loop workflows: reviewing shell or tool execution before the agent proceeds.

## What Changed

Android now loads gateway-backed exec approvals when the app connects, resumes, opens the approval surface, or runs a manual refresh. It also handles live gateway events for requested and resolved approvals while connected.

The implementation keeps approval review inside the app rather than making notification delivery the source of truth. That means it does not depend on FCM, background notifications, local notifications, or notification permission. Those can still become attention-routing layers later, but the actual approval state is available through the in-app screen while the phone is connected.

The UI keeps existing chat pending tool-call indicators visible and adds explicit counts for gateway pending approvals and session activity. When there are no gateway approvals, Android now communicates that the inbox is available and will show exec requests while connected.

## Why This Matters

Exec approvals are part of OpenClaw's safety boundary. They are how a user can let an agent work quickly without giving it silent permission to run sensitive commands.

For mobile operators, the approval surface needs to be boring and reliable. If the agent asks to execute something, the phone should be able to show the request, hydrate enough detail to make a decision, and resolve that decision through the gateway. PR #95593 moves Android toward that model.

The merged patch is also careful about scope. It does not add remote push delivery. It focuses on connected in-app parity first, which is the right foundation: make the canonical approval state correct before layering alerts on top.

## Evidence From the Merge

The PR includes before-and-after emulator captures and an approval-flow GIF hosted as review artifacts. The author reports Android unit tests and debug builds for Play and third-party variants, plus an emulator install of the debug APK.

Some lint and formatting checks were blocked by pre-existing untouched-file issues, which the PR calls out explicitly. The core build and visual proof for the approval workflow passed.

For Android users, the important shift is practical: gateway exec approvals should now appear in the OpenClaw app's Approvals screen instead of requiring desktop or iOS review paths.
