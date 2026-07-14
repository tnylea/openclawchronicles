---
title: "OpenClaw Adds Cloud Workers to Control UI"
excerpt: "OpenClaw now lets operators start cloud worker sessions from Control UI, with recovery records and OAuth route fixes for remote runs."
coverImage: '/assets/images/posts/openclaw-2026-7-14-control-ui-cloud-workers.png'
date: '2026-07-14T23:00:00.000Z'
dateFormatted: July 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-14-control-ui-cloud-workers.png'
---

OpenClaw merged a major Control UI upgrade Tuesday evening that brings cloud worker sessions into the normal New Session flow. Instead of reaching for direct RPC or CLI commands, operators can now choose a configured cloud worker profile from the browser and start the session there.

The main change landed in [OpenClaw PR #107670](https://github.com/openclaw/openclaw/pull/107670). A follow-up fix in [PR #107791](https://github.com/openclaw/openclaw/pull/107791) tightened OpenAI OAuth routing for those remote sessions, making the cloud-worker story more complete by the end of the nightly window.

## What Changed

The New Session page now discovers configured worker profiles and exposes them under a Where selector. When a cloud profile is selected, Control UI creates the session with the managed-worktree contract required by remote dispatch and hands the first turn to the active worker.

That first-turn handoff is the hard part. The PR adds a credential-scoped recovery record tied to the current browser tab, so a reconnect during session creation or first-send dispatch does not leave the user guessing whether the worker took the job. If the failure is definitive, OpenClaw tears down the worker and returns the draft to an editable state.

The sidebar also reflects cloud placement state, so the remote location remains visible after the session starts.

## Why It Matters

Cloud workers are most useful when they feel like a placement option, not a separate operating mode. The old path made remote sessions possible, but it pushed operators toward CLI or RPC workflows and made browser recovery awkward.

This update puts cloud placement into the same flow as local work. That matters for teams that want to shift heavy jobs to remote machines, keep local devices responsive, or use managed worktrees without asking every operator to memorize a separate launch path.

The follow-up OpenAI OAuth fix is also important. Cloud workers keep the OpenClaw harness on the remote machine while inference credentials stay on the Gateway. PR #107791 projects the selected auth profile onto the provider-owned physical model route before materializing the model, so gateway-owned ChatGPT/Codex OAuth models can run from a worker without exporting credentials to that worker.

## User Impact

Operators can select Cloud plus a profile in Control UI, start the session remotely, and continue in the normal chat/sidebar experience. Attachments survive recovery paths, stale handoffs are cleaned up, and failed worker starts no longer strand billable resources or lock the composer indefinitely.

For OpenAI OAuth users, cloud worker sessions can use gateway-owned models such as GPT-5.6 Sol while keeping credential ownership on the Gateway. API-key profiles continue to use the public Responses route.

## Verification

The cloud session PR reports 47 focused unit tests and 28 Chromium E2E tests across recovery, submit, target, and New Session coverage. It also reports a live ClawMac proof where Control UI selected `Cloud · aws`, created a forced worktree session, completed a real OpenClaw turn on AWS, refreshed the browser with the cloud badge intact, and then cleaned up the environment.

The OAuth follow-up reproduced a local-versus-AWS failure, verified the projected route through a live probe, and passed the focused worker inference runtime suite plus `pnpm check:changed`.
