---
title: "OpenClaw Stops Browser Actions After Cancellation"
excerpt: "OpenClaw browser tools now pass cancellation into node discovery, preventing timed-out turns from launching late local browser actions."
coverImage: '/assets/images/posts/openclaw-2026-8-16-browser-cancel-node-discovery.png'
date: '2026-08-16T23:02:00.000Z'
dateFormatted: August 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-16-browser-cancel-node-discovery.png'
---

OpenClaw merged a focused browser-tool cancellation fix in [PR #124880](https://github.com/openclaw/openclaw/pull/124880), preventing cancelled or timed-out agent turns from getting stuck in browser node discovery or dispatching a late local browser action.

The failure mode was subtle. Browser-capable node discovery could continue after the surrounding tool execution was already cancelled. In the automatic logged-in browser path, cancellation could be swallowed by fallback handling, allowing a local browser status action to run after the user or runtime had already stopped the turn.

## What Changed

Node discovery now receives the browser tool execution signal. That gives cancellation priority over the existing automatic host fallback while keeping ordinary transient discovery failures on the intended fallback path.

In practical terms:

- explicit browser node discovery can stop promptly when the tool run is cancelled
- automatic `profile=user` routing no longer treats cancellation like a recoverable discovery miss
- logged-in browser fallback still works for ordinary transient discovery failures
- cancelled or timed-out turns do not start a browser action afterward

The patch is intentionally narrow. It changes cancellation propagation and fallback precedence for the browser extension path without reshaping browser profiles, local routing, or the tool API.

## Why It Matters

Browser automation is one of the places where late work feels most dangerous. A user who cancels a run expects the browser tool to stop looking for places to execute, not to fall back into a local action after the control signal has been sent.

This fix is part of a broader OpenClaw pattern: cancellation and timeout signals need to travel through discovery layers, not just through the final action. When discovery itself can block or decide to fall back, it must know whether the caller is still alive.

## Evidence From The PR

The author reports that the regression proved red before the fix. Explicit discovery did not receive the execution signal, and automatic `profile=user` discovery swallowed cancellation before running local browser status.

Validation included:

- `extensions/browser/src/browser-tool.test.ts` with 178 tests passing
- browser extension production typechecks
- browser extension test typechecks
- type-aware oxlint with zero warnings and zero errors
- independent exact-diff review closing the prior cancellation and fallback P1

## Operator Takeaway

For OpenClaw users who rely on browser-capable nodes, this is a reliability and trust fix. Cancelling a browser turn should mean the turn is done. PR #124880 makes that expectation hold through the discovery step that decides where the browser action would run.

The visible result is quieter and safer: timed-out or cancelled browser work no longer comes back from a fallback path with one last action.
