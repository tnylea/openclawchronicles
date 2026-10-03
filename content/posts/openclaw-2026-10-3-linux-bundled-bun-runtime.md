---
title: "OpenClaw Adds Bundled Bun for Linux Gateways"
excerpt: "OpenClaw Linux now ships a verified bundled Bun runtime, giving fresh Gateway installs a faster default while preserving existing operator choices."
coverImage: '/assets/images/posts/openclaw-2026-10-3-linux-bundled-bun-runtime.png'
date: '2026-10-03T23:00:00.000Z'
dateFormatted: October 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-3-linux-bundled-bun-runtime.png'
---

OpenClaw's Linux companion now has a verified bundled Bun runtime path for Gateway installs, following the merge of [PR #164401](https://github.com/openclaw/openclaw/pull/164401) on October 3rd. The change is notable because it does two things at once: it moves fresh Linux setups toward the OpenClaw-managed Bun runtime, and it deliberately avoids replacing an operator's existing Gateway runtime just because the desktop app starts or updates.

That balance matters. Runtime changes are powerful operational changes, especially on self-hosted systems where a Gateway service may have been tuned, supervised, or pinned by the operator. This PR adds the new runtime option without turning app launch into an implicit migration event.

## What Changes for Linux Users

Fresh Linux setup now installs the Gateway on bundled OpenClaw Bun. Existing services keep their current runtime until the user explicitly chooses the new **Use bundled runtime** action and confirms the change.

The PR describes coverage for several existing states:

- Node-backed Gateway services
- Older bundled Bun slots
- Operator-selected runtimes
- Paused services, which must be started before conversion

The bundled runtime is Linux-only for now. macOS keeps its existing native app ownership model, Windows is deferred until a signed OpenClaw Bun fork build is available, and FreeBSD stays on system Node.

## Why the Design Is Conservative

The important detail is custody. OpenClaw is not making the desktop companion a silent runtime-replacement owner. The canonical CLI still owns installation and service mutation, while the Linux app observes the current state and asks for an explicit confirmed action before switching.

The implementation also records the runtime pin and service definition observed at the time of the action. If either observation changes before installation, the action refuses instead of applying a stale assumption. That protects cases where an operator or another tool touches the Gateway service while the UI is open.

Failed health checks report the error and provide the CLI command to return to Node:

```bash
openclaw gateway install --force --runtime node
```

There is intentionally no automatic rollback owner in this flow. Recovery stays explicit, visible, and CLI-owned.

## Runtime Verification Gets Shared

The PR says the shared Bun pin now serves CI, native macOS, and Linux. Linux packaging stores the verified Bun bytes in an `OPENCLAW-BUN-RUNTIME-V1` resource envelope so packaging tools cannot rewrite them, then materializes immutable runtime directories.

The verification bar is also shared. The PR body lists paired Node/Bun replay, a Node-hidden Bun-only smoke test, native macOS probes, packaging checks, ABI smoke, and live Linux runtime journeys as evidence. That makes this more than a packaging tweak; it is a cross-platform runtime qualification pipeline being extended to Linux.

## Why It Matters

For new Linux users, this should make the default Gateway runtime more predictable: OpenClaw can ship and qualify the exact Bun runtime it expects. For existing operators, the more important news is what does not happen: the app does not silently replace Node, does not revive automatic migration, and does not claim rollback ownership it cannot safely guarantee.

This is the kind of infrastructure change that should be boring in daily use. Fresh installs get the new fast path, careful operators keep control, and runtime changes become a deliberate action instead of a side effect of opening the app.
