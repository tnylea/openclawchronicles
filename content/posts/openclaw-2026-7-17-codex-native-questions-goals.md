---
title: "OpenClaw Adds Native Codex Questions and Goals"
excerpt: "OpenClaw now surfaces Codex structured questions and native thread goals in Control UI and supported chat channels."
coverImage: '/assets/images/posts/openclaw-2026-7-17-codex-native-questions-goals.png'
date: '2026-07-17T08:01:00.000Z'
dateFormatted: July 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-17-codex-native-questions-goals.png'
---

OpenClaw merged a major Codex parity slice just before the July 17 morning cutoff. [PR #109724](https://github.com/openclaw/openclaw/pull/109724), `feat(codex): surface native questions and goals`, landed at 07:35 UTC with a direct bridge for Codex app-server questions and thread goals.

The problem was practical. Codex app-server runs could ask for structured user input or expose a native thread goal, but OpenClaw flattened those questions into text and had no native goal command path. Control UI users could not answer the structured request in place, and operators needed a separate OpenClaw-side model of goal state.

That split is now narrower.

## What Changed

OpenClaw now carries native Codex `request_user_input` questions through its typed presentation layer into Control UI and supported channels. Users can answer choice and free-form questions from the same surface where the run is happening.

The PR also routes request-scoped answers back to the waiting app-server request. Secret questions stay on the warned text path and do not receive an action token, preserving the safety distinction between ordinary structured choices and sensitive prompts.

On the goal side, `/codex goal` commands now map directly to upstream Codex thread goal APIs: get, set, and clear. The PR explicitly avoids a parallel OpenClaw goal store. That matters because duplicated state would make it harder to know which system owns the current thread objective.

## Why Goals Stay Bounded

One subtle decision is just as important as the visible UI work. The PR does not enable per-thread `features.goals` by default because upstream Codex currently couples that feature to automatic idle continuation.

In other words, OpenClaw can inspect and update the native upstream goal, but this slice does not turn on autonomous goal-driven follow-on turns. That keeps the integration useful without quietly changing how much work a Codex thread may start on its own.

Provider-neutral question RPC and broader autonomous continuation design remain later work.

## User Impact

Control UI users should see Codex questions as structured cards instead of plain text prompts. Supported channels can receive typed choice actions, and Codex operators can inspect, set, pause, resume, block, complete, or clear the upstream thread goal through `/codex goal`.

For people running OpenClaw as a control plane around Codex, this makes Codex-native workflows feel less bolted on. A model can ask for a real choice, the user can answer without leaving the thread, and the result returns to the exact waiting request.

## Evidence

The PR cites upstream Codex contracts at a specific `openai/codex` commit, including the `request_user_input` method, question and answer wire shapes, response submission, native goal methods, and `turn/plan/updated` projection behavior.

Testing included 35 Control UI tests, 325 Codex extension tests, and a full changed-surface Testbox gate covering typecheck, lint, format, API baseline, plugin boundaries, i18n, database and state guards, and import-cycle checks.

The source-blind Control UI behavior proof also covered the important interaction states: no initial card, native plan display, structured question display, scoped exact-label answer emission, resolved card cleanup, and secret-question handling without a card.

## Operator Takeaway

PR #109724 is a strong signal that OpenClaw's Codex integration is moving from transcript mirroring toward native protocol behavior.

If your workflows depend on Codex asking clarifying questions or tracking thread objectives, this change is worth watching in the next release. It reduces friction at the exact point where human input and long-running agent state meet.
