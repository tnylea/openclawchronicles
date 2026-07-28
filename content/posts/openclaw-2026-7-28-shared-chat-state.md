---
title: "OpenClaw Unifies Web And Terminal Chat State"
excerpt: "OpenClaw now keeps web and terminal views on one shared session state, reducing stale history, duplicate prompts, and branch leaks."
coverImage: '/assets/images/posts/openclaw-2026-7-28-shared-chat-state.png'
date: '2026-07-28T23:00:00.000Z'
dateFormatted: July 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-28-shared-chat-state.png'
---

OpenClaw merged a large chat-state fix on Tuesday that makes the web UI and terminal share one canonical view of a session. [PR #115429](https://github.com/openclaw/openclaw/pull/115429), titled `fix(chat): make web and terminal share one session state`, landed at 22:53 UTC and targets one of the most annoying failure modes in multi-surface agent work: two clients showing different versions of the same conversation.

The PR says the previous split could expose stale history, duplicate prompts, missing terminal replies, privacy leaks across transcript branches, and divergent reconnect state. That is exactly the kind of defect that becomes painful once users keep the same OpenClaw session open in a browser, a terminal, and possibly a split-pane workflow.

## What Changed

The change makes the browser-safe shared session projection the owner of transcript identity, message ordering, optimistic sends, Gateway acknowledgements, durable message adoption, terminal replies, replay, failures, reset, reconnect, and branch identity.

In plain terms, web and terminal clients should now agree on what the session is, where the current branch is, and which messages have actually been committed. The previous browser history merger and terminal-specific reconciliation paths are removed in favor of a single shared projection.

The PR does not introduce a new Gateway protocol, storage format, schema migration, or dependency. That matters because this is a behavior and ownership cleanup inside an already active surface area, not a new compatibility boundary operators have to plan around.

## Why It Matters

OpenClaw sessions are increasingly long-lived. Users switch surfaces, fork or rewind branches, submit concurrent prompts, reconnect after stale snapshots, and attach image-only turns. When each client has its own recovery logic, edge cases multiply quickly.

The user impact section for [PR #115429](https://github.com/openclaw/openclaw/pull/115429) calls out several specific cases now covered by the shared state path:

- Identical concurrent prompts across clients
- Persisted-before-acknowledgement races
- Image-only turns
- Streamed and legacy text-only final replies
- Stale snapshots and reconnects
- Branch changes and destructive resets

The branch and reset pieces are especially important for privacy. The PR states that destructive reset and branch changes still invalidate older in-flight requests and cannot leak private transcript history.

## Smaller Surface, More Proof

The implementation is sizable, but the net effect is simpler. The PR reports the repository becoming 743 lines smaller overall, including 450 fewer production lines and 293 fewer test lines. The browser history reconciliation path shrinks from 499 lines to a 59-line adapter.

The validation story is also unusually broad. The merged PR cites 1,365 passing tests across 23 real Gateway, shared-client, browser, terminal, and subscription test files. It also reports real Gateway proof that authenticated web and terminal clients observe the same ordered, session-isolated committed transcript.

For users, this is one of those quality-of-life fixes that should feel invisible when it works. The same OpenClaw conversation should simply stay the same conversation, whether it is viewed from the browser, the terminal, or both at once.
