---
title: "OpenClaw Adds Private Signal Daemon Sockets"
excerpt: "OpenClaw now lets managed Signal accounts opt into private UNIX sockets, reducing cross-user local daemon exposure on POSIX hosts."
coverImage: '/assets/images/posts/openclaw-2026-9-17-signal-private-daemon-sockets.png'
date: '2026-09-17T08:02:00.000Z'
dateFormatted: September 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-17-signal-private-daemon-sockets.png'
---

OpenClaw merged an important Signal hardening change just before the morning cutoff. [PR #143511](https://github.com/openclaw/openclaw/pull/143511), titled "feat(signal): opt into private managed daemon sockets," adds an opt-in `channels.signal.transport.socketPath` setting for managed native Signal accounts.

The short version: managed Signal can now talk to `signal-cli` over a validated UNIX-domain JSON-RPC socket instead of the existing localhost HTTP listener. HTTP remains the default, so existing installs do not change behavior automatically.

## What Was Exposed

The PR describes the previous managed transport as an unauthenticated localhost HTTP RPC listener. On shared POSIX machines, that meant another local process, including one owned by a different OS user, could potentially reach the listener and issue Signal daemon RPC calls.

That is a narrow but serious boundary. OpenClaw is frequently used on developer workstations, home servers, and small shared hosts where "local" does not always mean "same trust zone." For a messaging channel, local daemon access deserves a stronger isolation story.

## What Changed

The new option selects `signal-cli`'s existing UNIX-domain JSON-RPC protocol under a socket path that OpenClaw validates before startup and before each connection.

The guardrails are specific:

- Socket paths must normalize to absolute paths
- Ancestors must be owned by the current user or root
- Writable-by-others ancestors are rejected
- Symlink traversal is refused
- The immediate parent is created with mode `0700`
- Socket endpoints must be owned by the current user
- macOS rejects non-owner allow ACL entries and inheritable ACLs

Socket failures do not fall back to HTTP. That fail-closed behavior matters because a private-socket opt-in should not silently downgrade to the older listener.

## User Impact

For most users, nothing changes until they configure `channels.signal.transport.socketPath` at the root or account level. Existing HTTP defaults, explicit HTTP endpoints, external daemons, and container transports retain their current behavior.

For operators running Signal on multi-user hosts, this gives managed-native accounts a cleaner local isolation boundary. The PR is explicit that the socket separates OS users, not same-user processes or administrators. That is the right level of precision: this is not a magic sandbox, but it removes a broad local HTTP surface.

Setup and Doctor also preserve the opt-in and refuse invalid socket configurations instead of reconstructing HTTP behind the user's back.

## Validation

The evidence is unusually concrete for a transport-boundary change. The full Signal extension suite passed across 52 files, targeted client and send suites passed 48 tests, and real `signal-cli` 0.14.7 accepted version and subscription RPCs over an isolated socket with zero TCP listeners.

The PR also includes macOS boundary tests, filesystem isolation proof against a real local socket daemon, and a direct cross-user final-effect check where a UID 65534 container received `PermissionError: [Errno 13] Permission denied` when trying to connect through a mode-0700 parent.

No real Signal accounts or live message delivery were exercised, and the PR says so plainly. The claim is about filesystem and protocol isolation, not end-to-end Signal delivery.

For a channel integration that can carry private messages, this is a strong morning merge: opt-in, compatibility-preserving, and grounded in the exact boundary it intends to improve.

Source: [OpenClaw PR #143511](https://github.com/openclaw/openclaw/pull/143511).
