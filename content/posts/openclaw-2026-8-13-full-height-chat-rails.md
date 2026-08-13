---
title: "OpenClaw Makes Chat Rails Full-Height Columns"
excerpt: "OpenClaw's Control UI now treats Workspace, Tasks, Companion, and detail rails as full-height resizable columns with shared chrome."
coverImage: '/assets/images/posts/openclaw-2026-8-13-full-height-chat-rails.png'
date: '2026-08-13T23:02:00.000Z'
dateFormatted: August 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-13-full-height-chat-rails.png'
---

OpenClaw's Control UI received a visible layout overhaul tonight with [PR #122475](https://github.com/openclaw/openclaw/pull/122475), titled "refactor(ui): make chat rails full-height resizable columns." The change moves several chat-adjacent surfaces into a shared column model instead of treating them as panels tucked below the chat header.

The PR covers Session Workspace, Background Tasks, Session Companion, detail surfaces, board chat, browser, and terminal-adjacent behavior. The goal is not a flashy redesign. It is a practical cleanup of the surfaces operators use while supervising agent work.

## What Changed

Before this merge, chat rails could start below the chat header and use inconsistent header heights, dividers, actions, and resize behavior. Terminal already behaved more like an independent full-height column, so the rest of the rail system had drifted from the strongest existing pattern.

The new layout makes the conversation and adjacent rails sibling columns. Workspace, Tasks, and Companion now use the existing `DockLayoutController`, giving them full-height placement, drag resizing, width persistence, and close or reopen behavior through the same mechanism.

The PR also centralizes rail chrome. Headers use a 48px contract, shared title geometry, aligned actions, and one separator between adjacent columns. Dismissible rails use close semantics, while Workspace and Tasks keep collapse behavior.

## Which Surfaces Benefit

The surface matrix in the PR is broad. Changes and diff views, file previews, images, Markdown or tool output, Canvas, Discussion and ClickClack, Board Chat, Browser, Session Workspace, Files, Background Tasks, Session Companion, Terminal, Desktop, and Custodian all get touched by the shared rail contract.

The user-facing effect should be most noticeable in busy sessions. An operator can keep a chat conversation, task list, workspace, companion, detail view, or terminal visible without the UI feeling like a stack of unrelated panels. Resize handles remain discoverable, widths survive close and reopen, and the bottom Workspace preference remains supported when Tasks are open.

## Why It Matters

OpenClaw is not just a chat box. It is a control surface for agents that edit files, run tools, manage background tasks, open previews, and report progress. The interface needs to make parallel state easy to scan.

This merge makes that control surface more predictable. The same header height and action placement across rails reduces visual drift. Shared resize and persistence behavior also means operators can arrange their workspace once and expect it to stay put.

The validation evidence is substantial for a UI refactor: screenshots across light and dark themes, browser coverage for rail geometry and close/collapse semantics, drag resize, persistence, preserved bottom preference, and web/native dashboard insets.

## The Bottom Line

[PR #122475](https://github.com/openclaw/openclaw/pull/122475) is a Control UI ergonomics upgrade. Full-height resizable rails should make OpenClaw's busiest agent sessions easier to supervise, especially when Workspace, Tasks, Companion, details, and Terminal are all part of the same workflow.
