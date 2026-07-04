---
title: "OpenClaw Terminals Now Survive Reconnects"
excerpt: "OpenClaw's Control UI terminal can now detach, reattach, and replay recent output after reloads, sleep, or network drops."
coverImage: '/assets/images/posts/openclaw-2026-7-4-terminal-reattach.png'
date: '2026-07-04T23:01:00.000Z'
dateFormatted: July 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-4-terminal-reattach.png'
---

OpenClaw merged [PR #100089, "feat(gateway): terminal detach/reattach with output replay, terminal.list, terminal.text"](https://github.com/openclaw/openclaw/pull/100089) minutes before the July 4th nightly cutoff, adding a long-requested reliability layer to the Control UI terminal.

The problem was simple and painful: terminal sessions were tied directly to the Gateway WebSocket connection. If an operator closed a laptop, refreshed the browser, or hit a transient network drop, the PTY tree was killed immediately. Any command running inside that terminal went with it.

This PR changes that model. Terminal sessions can now outlive the viewer connection, reattach later, and replay recent output so operators can keep their place.

## What Changed

The new terminal behavior is built around a bounded output ring and an explicit detach lifecycle. Each terminal session keeps a 256 KiB buffer of recent raw output. When the Control UI reconnects, it can replay that buffer before streaming new output.

The Gateway now exposes three additive terminal methods:

- `terminal.attach {sessionId}` rebinds a live or detached terminal session to the current admin connection and returns its buffered output.
- `terminal.list` returns attachable sessions, including the shell, working directory, agent id, attachment state, and creation time.
- `terminal.text {sessionId}` returns the buffered terminal output as plain text without attaching.

That last method is especially useful for agent and tool workflows. It gives an LLM-readable view of recent terminal output without taking over the operator's session.

## Safer Detach Semantics

Disconnects now park terminal sessions instead of killing them immediately. Detached sessions are reaped after `gateway.terminal.detachedSessionTimeoutSeconds`, which defaults to 300 seconds. Operators who prefer the old fail-closed behavior can set that value to `0`.

The PR also caps detached sessions at eight, evicting the oldest when needed, and still hard-kills everything on Gateway shutdown. That keeps the feature useful for ordinary reconnects without turning terminals into unbounded background processes.

The Control UI stores live terminal session ids per browser tab using `sessionStorage`. That is deliberate: reattach is a take-over operation, so using shared origin-wide storage would let multiple windows clobber each other's terminal session ids.

## Why It Matters

This is a quality-of-life change, but it touches a serious operator workflow. OpenClaw's terminal is used for long-running installs, diagnostics, tests, and maintenance commands. Losing that shell because a laptop slept or a browser tab refreshed is more than annoying; it can leave users unsure whether a command is still running, partially applied, or gone.

The new model is closer to a lightweight tmux-style recovery path. It does not promise full terminal persistence across Gateway restarts, multi-viewer sharing, or a true server-side VT snapshot. The PR explicitly leaves those as follow-ups. But it does cover the common reconnect cases that trip up daily Control UI use.

## Validation

The PR reports focused unit coverage for output ring bounds, detach and reaper timing, attach rebinding, buffer replay, text rendering, live owner take-over notifications, list ordering, detached-session cap eviction, shutdown cleanup, and handler kill-switch gating.

It also includes a live end-to-end test against a real dist Gateway. The test started a looping terminal command, reloaded the page, confirmed the same session id reattached, saw earlier ticks replay from the buffer, and then verified new terminal input still worked after reload.

Typecheck and lint lanes were reported clean, and a review concern about teardown close RPCs killing reattachable sessions was rejected with live proof and a documented invariant.

## Bottom Line

OpenClaw terminals are becoming resilient enough for real operator work. Reloads, laptop sleep, and short network drops no longer have to mean losing the shell, the output, and the command that was still running.
