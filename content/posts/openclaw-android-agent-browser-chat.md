---
title: "OpenClaw Android Adds Agent Browser In Chat"
excerpt: "OpenClaw Android users can now control the agent browser inside chat, keeping conversation context and drafts while operating browser tabs."
coverImage: '/assets/images/posts/openclaw-android-agent-browser-chat.png'
date: '2026-09-27T23:02:00.000Z'
dateFormatted: September 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-android-agent-browser-chat.png'
---

OpenClaw's Android app is gaining a more capable in-chat browser experience for agent-controlled tabs.

The feature landed in [PR #159767](https://github.com/openclaw/openclaw/pull/159767), titled `feat(android): control the agent browser inside chat`. It gives Android users a way to operate the agent's existing browser without leaving the conversation or losing a draft.

## What Changed

When an agent uses the browser, Android can now show the exact session tab directly inside chat. The card includes expand and collapse controls plus a separate close icon.

The behavior is intentionally careful:

- Collapse returns space to the chat and releases the browser keyboard.
- Close hides the card without closing the remote browser tab.
- Chat actions can restore the Agent browser card.
- A dismissed historical result stays hidden while the app runs.
- A new browser result can appear again.

That last detail is subtle but important. The app distinguishes between a result the user has dismissed and a genuinely new browser result that deserves attention.

## How Authority Works

The PR says embedded control keeps `operator.admin` and requires an updated Gateway with the bundled Control UI. If the Gateway is older, the UI is disabled, or a custom UI root is configured, Android shows a closable update notice rather than loading an unsupported WebView.

OpenClaw is not adding a new browser service here. The Gateway and Browser plugin still own browser authority, while Android owns presentation, dismissal, and native input behavior.

Ordinary links and Desktop remain unchanged, and external opening still requires an explicit user action.

## Why It Matters

Browser automation is most useful when users can see and guide what the agent is doing. On mobile, that can easily become awkward: a WebView can steal focus, cover the draft, or force the user to bounce between browser state and chat context.

This update is aimed at that ergonomic gap. The agent browser becomes part of the chat flow rather than a separate place the user has to manage.

The implementation also pays attention to native input. The PR describes support for touch scrolling, soft-keyboard text, composition, and ordered input. Unsupported local autocorrection shows a notice instead of appending incorrect replacement text.

## Verification

The PR includes Android and Gateway verification across build, lint, focused regressions, capability boundaries, browser routing, and input behavior. It also includes screenshot and recording evidence from an Android app and Chromium on Android 16/API36.

For Android users who rely on OpenClaw's browser-capable agents, this is a meaningful workflow improvement: less context switching, better control over browser visibility, and a safer fallback when the connected Gateway cannot support the embedded browser path yet.
