---
title: "OpenClaw Google Chat Sends Now Honor Cancellation"
excerpt: "OpenClaw PR #151146 stops canceled Google Chat sends after token, recipient, or redirect preparation while preserving accepted messages."
coverImage: '/assets/images/posts/openclaw-2026-9-17-google-chat-cancellation-guard.png'
date: '2026-09-17T22:16:00.000Z'
dateFormatted: September 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-17-google-chat-cancellation-guard.png'
---

OpenClaw merged [PR #151146](https://github.com/openclaw/openclaw/pull/151146), a P1 Google Chat channel fix for cancellation boundaries during message delivery. The bug allowed a Google Chat send to continue after the send owner was canceled while the plugin was still resolving a DM recipient or obtaining an access token.

In agent systems, cancellation needs to follow the work all the way to the network edge. This PR tightens that handoff for Google Chat.

## The Bug

The PR says both the preferred text registration and the generic message action discarded the host's handoff callbacks. That meant later HTTP requests could escape the existing cancellation checks after preparation work had already happened.

There was another edge case too: a same-origin redirect could issue another request after cancellation. In practical terms, the request boundary was not being checked late enough.

## What Changed

The two registered send routes now carry existing callbacks through recipient resolution to the Google Chat HTTP owner. The synchronous assertion reaches the guarded fetch `beforeRequest` hook, which runs after network preparation and before each redirect hop.

That placement matters. A send can be canceled while OpenClaw is waiting for token preparation, DM lookup, or redirect handling. The fix makes the next Google Chat request stop when custody has been lost.

The PR also preserves successful deliveries correctly. If Google Chat already accepted a message, that confirmed identity still settles normally. A late cancellation does not turn an accepted send into a failed delivery that might be retried.

## User Impact

Users should see fewer obsolete Google Chat messages leaking out after a task is canceled or superseded. That is especially important for long-running or multi-step automation, where a stale delivery may no longer represent the current state of the conversation.

The fix covers:

- DM recipient lookup before posting
- Access-token preparation before posting
- Redirect hops before another request is made
- Preferred text registrations
- Generic message actions
- Concurrent account and target handling
- Durable settlement of already accepted messages

There is no user-facing configuration change. The improvement is in the delivery boundary.

## Evidence From The PR

The PR reports that the baseline integration fixture reproduced successful sends after revocation through both registered routes, token and DM lookup waits, and a real HTTP 307 redirect. The accepted-response settlement control already passed before the fix, which helped prove that the repair should preserve successful deliveries.

After the change, all 411 Google Chat tests across 38 files passed on Blacksmith Testbox. The focused cancellation, dispatch, redirect, concurrent-account, and durable-settlement regressions passed again on the corrected final tree. Extension type checks, changed-file typed lint, selected static guards, and shared Doctor contract tests also passed.

Hosted CI passed on the merged head, and ClawSweeper rated it Platinum with no actionable findings. For Google Chat users, this is a clean reliability and safety upgrade: cancellation now reaches the final request boundary instead of stopping too early in the plugin stack.
