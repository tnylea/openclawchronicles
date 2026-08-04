---
title: "OpenClaw Recovers New Session Model Lists"
excerpt: "OpenClaw PR #119120 keeps configured model catalogs visible when optional command metadata fails during Gateway startup."
coverImage: '/assets/images/posts/openclaw-2026-8-4-new-session-model-recovery.png'
date: '2026-08-04T08:06:00.000Z'
dateFormatted: August 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-4-new-session-model-recovery.png'
---

OpenClaw merged [PR #119120, "fix: recover new-session models through Gateway startup"](https://github.com/openclaw/openclaw/pull/119120), a P1 Gateway and Control UI fix for the New Session flow.

The bug affected model selection at a frustrating moment: opening a new chat. Users could lose a valid configured model catalog when optional text-command metadata failed, or when the first `chat.metadata` request arrived while Gateway startup sidecars were still initializing.

That made a healthy model configuration look broken from the UI. The fix separates required model metadata from optional command metadata and adds a bounded retry path for the specific startup condition OpenClaw expects to be temporary.

## Required Models, Optional Commands

The Gateway now treats configured models as required metadata. If model discovery itself fails, OpenClaw still reports a fatal catalog error.

Text commands are different. They are useful metadata, but they should not erase a valid model list. PR #119120 says OpenClaw now captures synchronous command enumeration failures, logs them, and still returns the configured model catalog without commands.

That distinction is important because model selection is the core purpose of the New Session screen. Command discovery can degrade separately without making the whole picker unusable.

## Bounded Startup Retry

The Control UI retry path is narrow. It retries only the canonical startup-sidecars `UNAVAILABLE` response. Retries respect the server-provided delay, abort when the owning Lit task is invalidated, and stop after 60 seconds.

Unrelated errors still fail immediately. The PR explicitly says it does not weaken exec-approval migration checks, modify model configuration, or retry arbitrary failures.

This is a useful pattern for startup-time reliability: tolerate the known short window where sidecars are still coming online, but keep real failures visible.

## User Impact

Users opening New Session should keep seeing their complete configured model catalog even if unrelated command metadata is unavailable. If Gateway startup is still settling, the UI can recover automatically inside the bounded retry window.

The result is less false breakage. A valid model list should not disappear because command metadata failed, and a transient startup race should not force users to refresh or diagnose a configuration problem that is not real.

At the same time, real model-catalog failures remain visible. That preserves the operator signal needed when credentials, provider configuration, or model discovery actually need attention.

## Evidence

PR #119120 reports a Blacksmith Testbox run with 117 passing tests across Gateway metadata, Control UI model control, and Chromium New Session E2E coverage. The new rendered-browser case made exactly two `chat.metadata` requests, opened the picker, and found the uniquely recovered model.

The PR also reports `pnpm check:changed`, a successful production Control UI build, precompressed-asset validation, and a performance guard. A replacement exact-head CI run was green, including all four Control UI E2E shards.

The behavior contract records passes for optional command failure preserving models, required model failure remaining fatal, canonical startup retry count, recovered model visibility, no retry for noncanonical errors, task invalidation aborting waits, and the 60-second retry deadline.

For day-to-day OpenClaw use, this is a quality-of-life fix with real reliability weight. The model picker should now reflect configured models instead of becoming collateral damage from optional command metadata or startup timing.
