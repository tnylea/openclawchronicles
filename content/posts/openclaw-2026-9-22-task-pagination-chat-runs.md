---
title: "OpenClaw Task Pages Survive Active Chat Runs"
excerpt: "OpenClaw PR #155542 keeps task-list pagination usable while unrelated chat runs start and settle in the Gateway."
coverImage: '/assets/images/posts/openclaw-2026-9-22-task-pagination-chat-runs.png'
date: '2026-09-22T08:01:00.000Z'
dateFormatted: September 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-22-task-pagination-chat-runs.png'
---

OpenClaw merged [PR #155542](https://github.com/openclaw/openclaw/pull/155542), a Gateway fix that keeps task-list pagination valid while unrelated chat activity is happening elsewhere.

The bug was easy to feel and hard to love: task-list pages could expire when an unrelated chat run started or finished. Users paging through tasks could lose their cursor even though nothing about task visibility or sharing had changed.

## What Changed

The PR explains that chat dispatch published run-start and input-settlement events as access changes. That classification was too broad. Starting a run or settling input is live activity, but it does not by itself change who can see a task.

PR #155542 updates those publishers so the events are identified as liveness-only. Real sharing changes still invalidate the cursor and remove tasks the viewer can no longer access. The conservative default remains intact, as do metadata and sharing publishers, current-access checks, task revision, cursor binding, and ordering.

That makes the fix narrow in the right way. It protects pagination from noisy liveness churn without making stale access cursors linger after a real permission change.

## Why It Matters

Task pages are operational UI. They need to stay boring while other sessions are busy. If a user is reviewing work, paging through a queue, or scanning background jobs, unrelated chat traffic should not force the list to restart.

The improvement also avoids repeated access-validation work during those liveness updates. The PR does not claim a production speedup, but the direction is clear: keep access invalidation for access events, and keep ordinary run activity from looking like a sharing mutation.

## Regression Coverage

The regression uses a real registered Gateway path. It sends a `chat.send` with a held dispatch stub, pages through the actual run-start and settlement callbacks, then changes visibility through `session.visibility.set`.

The original code fails on the second page. A partial startup-only fix still fails on the third page. The complete fix passes both liveness phases, and it still rejects the old cursor after the real sharing change.

The PR also records broader validation: focused regression coverage, 283 tests across task pagination, ACP completion, session-change publication, and chat directive handling, targeted typed lint, Gateway server-test types, exact-head CI, and independent review with no P0 to P2 findings.

For OpenClaw operators, this is a clean Gateway quality-of-life fix. Task pagination now treats unrelated chat starts and finishes as activity, not as permission-changing events.
