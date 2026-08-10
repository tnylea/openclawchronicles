---
title: "OpenClaw Cloud Worker Startup Becomes Responsive"
excerpt: "OpenClaw merged a P1 Cloud Worker startup fix that routes users into the created session with durable progress, clearer failures, and one-shot sends today."
coverImage: '/assets/images/posts/openclaw-cloud-worker-startup-responsive.png'
date: '2026-08-10T08:04:00.000Z'
dateFormatted: August 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-cloud-worker-startup-responsive.png'
---

OpenClaw merged a major Control UI and Gateway reliability fix this morning: [PR #121200, "fix(ui): make Cloud Worker startup responsive"](https://github.com/openclaw/openclaw/pull/121200). It targets a frustrating startup path where a user could create a Cloud Worker session and then sit on an inert `/new` page while provisioning continued somewhere out of sight.

The PR also fixes a related model-catalog issue where selecting GPT-5.6 High could be rejected after ChatGPT catalog discovery admitted Platform-only alias rows with the wrong reasoning metadata.

## What Changed

Before this patch, `NewSessionPage` owned too much of the Cloud Worker startup lifecycle at once: durable session creation, worker dispatch, provisioning, sync, startup, first send, and navigation. If anything was slow or failed, the user could be left without a durable destination or visible progress.

The new design gives the application-lifetime Cloud startup coordinator ownership after durable session creation. The page navigates immediately into the created session, then Gateway-owned placement transitions show up as canonical progress states.

The PR body names those phases directly:

- Requested
- Provisioning
- Syncing
- Starting
- Sending

The initial prompt is preserved and sent once after active worker ownership is established. Recovery records are persisted per canonical session key, so reconnects and stale-client takeovers do not cancel or delete unrelated session work.

## Why It Matters

Cloud Workers are supposed to make heavyweight or remote work feel manageable from the Control UI. A frozen route does the opposite. It makes the user wonder whether a session exists, whether the prompt survived, and whether retrying will create duplicate work.

Moving progress into the created session gives the user a visible anchor. It also aligns with the way durable agents should behave: session state belongs to the session, not to the temporary page that launched it.

The model-catalog fix is smaller but still useful. Platform-only bare `gpt-5.6` and `chat-latest` rows are now filtered out of the ChatGPT catalog, preserving valid ChatGPT metadata for models that actually support High reasoning.

## Verification

This was not a small UI tweak. The PR reports broad focused coverage across Control UI, Gateway, and OpenAI paths, including:

- 89 final per-session durability and reconnect tests
- 8 Cloud browser E2E tests
- 9 browser E2E tests for Cloud startup and failure flows
- 302 focused tests across affected paths
- A passing production build
- A clean final P1-level Codex autoreview

The evidence section also notes source-blind behavior validation for immediate routing, visible placement phases, send-after-active ownership, stable idempotency, exactly one prompt, route survival, and visible failure.

## Bottom Line

[PR #121200](https://github.com/openclaw/openclaw/pull/121200) turns Cloud Worker startup from a route-bound wait into a session-owned workflow. Users should get a created chat route quickly, see meaningful provisioning progress, and avoid duplicate or lost startup sends when reconnects happen.
