---
title: "OpenClaw Speeds Provider Policy Loading for CI Runs"
excerpt: "OpenClaw merged a performance fix that avoids a heavy provider-model import path and removes a roughly 65-second source-checkout stall from CI runs today."
coverImage: '/assets/images/posts/openclaw-2026-8-26-provider-policy-load-time.png'
date: '2026-08-26T08:02:00.000Z'
dateFormatted: August 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-26-provider-policy-load-time.png'
---

OpenClaw merged a focused developer-experience performance fix this morning in [PR #129652, "perf: stop provider policy loads from compiling the transport graph"](https://github.com/openclaw/openclaw/pull/129652). The change removes a costly source-checkout stall that showed up when provider policy artifacts pulled in heavier runtime modules during provider resolution.

The headline number is big: the PR reports a first embedded host-route run dropping from about 65.5 seconds to about 6.6 seconds. For maintainers and CI jobs that touch provider resolution, that is the difference between a confusing timeout and a normal test warmup.

## The Import Problem

Provider policy artifacts such as `provider-policy-api.js` are supposed to stay lightweight because they load eagerly whenever OpenClaw resolves a provider. Five of those artifacts imported the `provider-model-shared` barrel at runtime. That barrel pulled in the transports, compatibility, and state graph.

In production distribution builds, that shape is less visible. In source checkouts without a native TypeScript require hook, however, jiti had to compile the larger graph. The PR says that first embedded run spent roughly 65 seconds in event-loop starvation before related test work even got moving.

That cost had already pushed `run.session-permissions.test.ts` past its 120-second timeout before an earlier repair, and it still made shared integration tests slower than they needed to be.

## What Changed

The fix adds a narrow local-only Plugin SDK subpath: `openclaw/plugin-sdk/claude-model-runtime`. It re-exports only the Claude identity and thinking helpers needed by local policy artifacts, without routing back through the heavier shared provider model barrel.

The Anthropic, Anthropic Vertex, and OpenCode policy artifacts switch to that smaller route. Amazon Bedrock and Ollama switch to existing `@openclaw/model-catalog-core` leaf modules. The public plugin-SDK API surface stays unchanged, because the new subpath is local-only.

The PR also pins a provider-agnostic auth-owner test to the mocked plugin-harness route and documents a default-route trap in `overflowBaseRunParams`, keeping the test intent clear while avoiding unnecessary host-route warmup.

## Why It Matters

This is not a user-facing button, but it affects the pace and confidence of the project. OpenClaw's provider matrix is broad, and policy checks sit near sensitive routing and authentication behavior. If every source-checkout provider resolution drags in a large transport graph, small changes become slower to verify.

By pushing policy artifacts back toward leaf dependencies, the project gets faster CI feedback without changing runtime behavior. That is the right kind of performance win: less waiting, same contract.

## Verification

The PR includes CPU profile data showing jiti self-time falling from 23.4 seconds to 1.3 seconds and `statSync` time falling from 18.6 seconds to 0.7 seconds. It also reports `run.shared-integration.test.ts` dropping from 167 seconds to 65 seconds, while a separate auth-owner test falls from 46 seconds to sub-second timing.

Validation covered Plugin SDK export checks, policy artifact suites across 13 files and 260 tests, `pnpm build`, changed-file checks, and a clean Codex autoreview. The built artifact was also checked to confirm the new local-only module imports only leaf chunks.

## Bottom Line

[PR #129652](https://github.com/openclaw/openclaw/pull/129652) is a clean OpenClaw maintenance win: fewer heavyweight imports, faster source-checkout tests, and no public API expansion.

For contributors working around provider policy, model catalogs, or embedded-run tests, this should make the feedback loop noticeably less sluggish.
