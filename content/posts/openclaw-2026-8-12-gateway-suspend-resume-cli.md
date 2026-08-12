---
title: "OpenClaw Adds Gateway Suspend and Resume CLI"
excerpt: "OpenClaw merged Gateway suspend and resume commands so operators can freeze, snapshot, and recover gateways without losing control-plane access."
coverImage: '/assets/images/posts/openclaw-2026-8-12-gateway-suspend-resume-cli.png'
date: '2026-08-12T08:00:00.000Z'
dateFormatted: August 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-12-gateway-suspend-resume-cli.png'
---

OpenClaw merged a Gateway operations change that makes host suspension usable from end to end. [PR #122100](https://github.com/openclaw/openclaw/pull/122100), titled "feat(gateway): make suspend/resume operator-usable end to end," adds CLI commands for preparing and resuming a Gateway around VM snapshots, process freezes, and other host-level maintenance windows.

The old shape had a sharp edge: once a Gateway entered the prepared suspension phase, fresh WebSocket handshakes were rejected at upgrade time. That fenced off work, but it also fenced off the control path needed to resume from a separate CLI or controller process. Operators could wait for the lease to expire or rely on a separate admin HTTP path, but the primary Gateway client could not cleanly resume the service it had suspended.

## What Changed

The merged fix changes the admission model. A prepared Gateway now accepts authenticated WebSocket connections for `gateway.suspend.*` methods while continuing to reject ordinary work. The PR describes the new boundary plainly: suspension fences work, not control-plane visibility.

That gives operators two new CLI surfaces:

- `openclaw gateway suspend`
- `openclaw gateway resume <suspensionId>`

The suspend command uses a stable request id, supports bounded waiting, and can list blockers. The resume command is idempotent, and an expired lease reports as a clean no-op instead of turning into another mystery failure.

## Better Failure Messages

The client side also changed. OpenClaw's Gateway client now reads bounded non-101 WebSocket upgrade responses and carries the structured refusal forward as a retryable request error. That matters during restart drain and suspension windows, because callers now see why a connection failed instead of the opaque abnormal-close path that previously appeared as a generic `1006`.

In practice, a blocked call during suspension can surface as an unavailable Gateway in the `prepared` phase, with a retryable reason. That is much more actionable than a low-level socket close.

## Why Operators Should Care

This is not a flashy feature for casual users, but it is important infrastructure work for people running OpenClaw as a durable service. Host-level maintenance is common: VM snapshots, hibernation, container pauses, process supervision, live migration, backup orchestration, and managed fleet operations all need a way to say "stop taking work, stay controllable, then resume."

The PR's evidence includes an isolated dev Gateway run where the team suspended the Gateway, froze the process with `SIGSTOP`, thawed it with `SIGCONT`, and resumed from a fresh process. They also verified the two-minute self-healing lease expiry path, wrong-id resume handling, repeated prepare behavior, and health recovery over both WebSocket and admin HTTP.

## The Bottom Line

OpenClaw is continuing to make Gateway operations less dependent on local process luck. The new suspend/resume path gives administrators a real maintenance handshake: prepare, block work, keep control access available, resume cleanly, and report failures in words an operator can act on.

For self-hosters and fleet operators, [PR #122100](https://github.com/openclaw/openclaw/pull/122100) is one of the more practical Gateway reliability merges of the week.
