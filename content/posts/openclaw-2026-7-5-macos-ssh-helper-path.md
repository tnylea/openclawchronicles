---
title: "OpenClaw Mac SSH Tunnels Keep Helper Paths"
excerpt: "OpenClaw for macOS now preserves SSH helper paths and inherited connection state, improving remote Gateway launches from Finder."
coverImage: '/assets/images/posts/openclaw-2026-7-5-macos-ssh-helper-path.png'
date: '2026-07-05T08:03:00.000Z'
dateFormatted: July 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-5-macos-ssh-helper-path.png'
---

OpenClaw merged [PR #100214, "fix(macos): preserve PATH for SSH helpers"](https://github.com/openclaw/openclaw/pull/100214), a macOS app fix for remote Gateway connections that rely on SSH helper commands.

The issue shows up when OpenClaw starts from Finder or another sanitized GUI environment. In those launches, the process may not inherit the same `PATH` a user expects from an interactive shell. SSH aliases that rely on bare `ProxyCommand` helpers can then fail because the helper command is not resolvable.

For users who connect OpenClaw to a remote Gateway through SSH aliases, that makes the Mac app feel unreliable even when the alias works perfectly in Terminal.

## What Changed

The macOS app now gives SSH preflight and tunnel processes an app-managed command path. That path includes OpenClaw's preferred command locations and now also includes the conventional user-local bin directory after system paths.

The PR also preserves inherited connection state such as `HOME` and `SSH_AUTH_SOCK`. That matters because SSH helpers and agents frequently depend on those values. Replacing the whole environment would solve one problem while creating another.

The change touches the macOS command resolver, remote Gateway probe, remote port tunnel setup, and focused tests. The changelog describes the user-facing effect directly: macOS SSH tunnels now resolve user-installed `ProxyCommand` helpers through the app's managed `PATH` while preserving inherited connection environment.

## Why It Matters

OpenClaw's native Mac app is increasingly responsible for making local and remote agent setups feel approachable. Remote Gateway support is a big part of that, especially for operators who keep the heavy runtime on another machine and use the Mac app as the client.

SSH aliases are the natural way many developers encode that setup. They may include bastion hosts, `ProxyCommand`, user-local helper binaries, or agent sockets. If those aliases only work from a login shell, the GUI app becomes a second-class path.

This fix narrows that gap. A remote alias that depends on common user-local helpers should now work when the app launches from Finder, not just when started from a shell with a hand-built environment.

## Validation

The PR reports 27 focused Swift tests through:

`swift test --filter 'RemotePortTunnelTests|CommandResolverTests'`

It also reports SwiftFormat lint on the touched Swift files. Beyond unit tests, the packaged app was launched with a system-only `PATH`, then used to verify that an SSH alias established its tunnel and the Gateway readiness probe succeeded.

The added tests check two important pieces of behavior: preferred paths include the user-local bin directory once, after system bins, and the SSH environment replaces stale `PATH` values without dropping inherited values such as `HOME` and `SSH_AUTH_SOCK`.

## Bottom Line

OpenClaw for macOS is getting better at acting like the environment users already configured. SSH aliases with helper commands should be less fragile when the app starts from ordinary GUI launch paths.
