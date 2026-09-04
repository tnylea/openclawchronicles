---
title: "OpenClaw Stops Duplicate A2A Replies"
excerpt: "OpenClaw now records message-tool delivery receipts so A2A sessions avoid duplicate final replies after a successful source delivery."
coverImage: '/assets/images/posts/openclaw-2026-9-4-a2a-duplicate-replies.png'
date: '2026-09-04T08:10:00.000Z'
dateFormatted: September 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-4-a2a-duplicate-replies.png'
---

OpenClaw has landed a message-delivery fix for A2A sessions: when a same-session `sessions_send` target has already delivered through the message tool, OpenClaw now avoids announcing that same reply again.

The fix shipped in [PR #137923](https://github.com/openclaw/openclaw/pull/137923), "fix(a2a): avoid duplicate source replies after message delivery." It was merged at 07:50 UTC on September 4, 2026.

## The Bug

The failure mode affected requester-visible replies. A target could use the message tool to deliver the final answer to the original external source, but the completed A2A run could then announce the reply a second time. In practice, that meant users saw duplicate completion markers even though only one useful answer was needed.

The PR describes the root cause as a lossy display projection problem. The display history did not always carry the successful tool-result row that proved source delivery had already happened. A2A then had to decide whether to mirror a side effect without reliable receipt data.

## The Fix

The message tool now records confirmed final delivery to the resolved external source route. Pi, Codex, CLI, and nested-tool collectors preserve that delivery fact before result middleware changes the output. A2A then consumes the terminal receipt and canonical terminal reply instead of reconstructing intent from history snapshots, fingerprints, or mirror-boundary inference.

The end result is a cleaner rule: already delivered source replies are not announced again.

The fix covers:

- Supported `reply`, `thread-reply`, and poll actions.
- Webchat requesters where A2A resolves an external source inside the message tool.
- Nested-tool paths where delivery needs to survive output transformation.
- Failure-after-delivery cases, which remain visible without recommending a resend.

It does not claim final delivery for progress messages, partial sends, dry runs, internal UI forwarding, or other-destination operations.

## Why Operators Should Care

This is the kind of reliability fix that makes agent systems feel less strange in day-to-day use. Duplicate replies erode trust because users cannot tell whether the agent repeated itself, retried unexpectedly, or performed the action twice. A delivery receipt gives OpenClaw a better source of truth than presentation history.

The PR reports three independent real-Gateway mirror proof passes on the final rebased production build, plus a live-provider `group-visible-reply-tool` run on the same build. Focused owner, A2A, waiter, Gateway, and route-contract test runs are also listed in the evidence.

The merged commit is `fa70549fe460b1aa25c334ad7efc2ca1c9cc6729`. For users running A2A or channel-heavy OpenClaw setups, the visible impact should be simple: one final reply when one final reply has already been delivered.

