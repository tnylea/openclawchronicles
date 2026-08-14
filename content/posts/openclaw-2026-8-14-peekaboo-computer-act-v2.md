---
title: "OpenClaw Brings computer.act v2 to macOS"
excerpt: "OpenClaw macOS now exposes native Peekaboo computer.act v2 support for window discovery, observation, lifecycle, and input."
coverImage: '/assets/images/posts/openclaw-2026-8-14-peekaboo-computer-act-v2.png'
date: '2026-08-14T23:03:00.000Z'
dateFormatted: August 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-14-peekaboo-computer-act-v2.png'
---

OpenClaw's native macOS automation path took a major step forward tonight with [PR #123801](https://github.com/openclaw/openclaw/pull/123801), which lets the Peekaboo fulfiller advertise and execute `computer.act v2` capabilities.

Peekaboo already handled the original screen-coordinate action family. The gap was that selecting Peekaboo did not unlock the newer v2 model: app and window discovery, exact-window observation, background window and element input, lifecycle operations, and structured effect or escalation results. This PR adds a native v2 companion while keeping the existing v1 path intact.

## What Peekaboo Can Now Do

The merged PR wires OpenClaw's macOS node into PeekabooAutomationKit owner APIs, including desktop observation, UI automation, application management, window management, and menu services.

When Peekaboo is selected on macOS, the node can now publish a v2 descriptor and support capabilities such as:

- discovering apps and windows;
- observing an exact window with a PNG and bounded accessibility elements;
- clicking, focusing, typing, pressing keys, scrolling elements, setting values, and invoking menus through fresh opaque refs;
- launching, killing, and bringing apps to front;
- returning structured `effect` values and escalation guidance.

The native path also reports what it does not support. Browser actions, recording and replay, zoom, and `escalate_scope` remain rejected and unadvertised.

## Background By Default

One of the important operator-facing details is delivery mode. Background delivery is supported for exact-window and accessibility-driven actions such as element click, element focus, typing, key input, element scroll, set value, and menu invocation.

Foreground delivery is still available for supported pointer and keyboard actions when explicit promotion is needed. The PR also documents the platform limits: PeekabooAutomationKit does not publicly provide background middle or triple click, or held and split pointer variants, so those requests return a structured foreground recommendation.

That clarity helps agents choose the least disruptive path. They can work against specific windows and elements without bringing everything to the front unless the requested action needs foreground input.

## Reference Safety

The implementation uses opaque app, window, observation, and element references that are process-local and execution-local. They are invalidated when lifecycle generation changes, and only the newest observation authorizes element or pixel actions.

That constraint is important for computer-use automation. It reduces the chance that an agent acts on stale UI state after an app changes, a window moves, or a previous observation stops matching the current desktop.

## Verification

The PR reports green exact-head CI across macOS Swift, iOS and shared-kit consumers, Android consumers, native internationalization, security, and macOS node checks. The unit and contract proof includes Swift tests, wire-decode tests, focused ComputerActionService and geometry tests, more than 2,000 Vitest assertions across CUA and tool shards, typechecks, lint, formatting, and autoreview.

Live paired-node proof is explicitly deferred to the W3-GATE integration row, which owns the authenticated dev-gateway rig. The PR does not claim that proof yet.

## The Bottom Line

[PR #123801](https://github.com/openclaw/openclaw/pull/123801) turns Peekaboo from a v1 screen-action fulfiller into a native macOS `computer.act v2` participant. For OpenClaw users building desktop automation on Macs, that means richer observation, safer references, clearer lifecycle behavior, and more background-first control over real app windows.
