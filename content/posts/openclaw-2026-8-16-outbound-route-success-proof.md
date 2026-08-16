---
title: "OpenClaw Stops Failed Sends From Hijacking Routes"
excerpt: "OpenClaw failed outbound sends no longer rewrite main session routes before delivery proof, preventing phantom channel identities."
coverImage: '/assets/images/posts/openclaw-2026-8-16-outbound-route-success-proof.png'
date: '2026-08-16T08:01:00.000Z'
dateFormatted: August 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-16-outbound-route-success-proof.png'
---

OpenClaw merged [PR #124459](https://github.com/openclaw/openclaw/pull/124459), changing outbound message routing so failed sends can no longer rewrite a main session to point at a channel target that never received the message.

The specific failure path matters for anyone running channel-connected agents. A command such as sending to a Telegram target without a configured token could previously persist route metadata before credential validation and delivery happened. The result was a phantom conversation: the Control UI could show a channel identity that had never been reached, and later webchat sends could bind to a dead route.

## Commit On Evidence

The fix makes route resolution read-only until OpenClaw has success evidence. The durable route and origin write now commits at the first delivery proof:

- an identified platform delivery result
- a plugin action acceptance event
- a post-return safety net for adapters without platform identity in their result

Both the normal outbound action path and the Gateway send RPC path received the same ordering change. First-contact routes still get created, but only once there is evidence that the message was accepted or delivered.

## Why The Old Ordering Was Risky

The prior behavior persisted the route too early. If delivery failed, OpenClaw could still stamp the main session with the attempted target and create a conversations-registry row for it. That made the UI and transcript metadata look as if the session had moved to a real channel conversation, even though the send never made it through.

In practice, that could produce several confusing outcomes:

- The Control UI displayed the wrong channel identity.
- Webchat turns could record the wrong source channel.
- The composer could bind to a phantom conversation whose sends failed.
- The original main-session identity was harder to reason about after a failed send.

PR #124459 removes the pre-send persistence branch and shifts the write to success evidence.

## Tests And Follow-Up

The PR includes a regression test proving the important split: failed sends leave the seeded main-session origin and conversation identity untouched, while successful sends still persist the mirror route. The author reports 109 Gateway send tests and 2 focused mirror-order tests passing after rebase, with typecheck, lint, formatting, and autoreview clean on the affected branch.

The PR also leaves a product question for maintainers: a successful outbound direct-message send can still rebind a differing existing main-session origin under `dmScope=main`. This patch preserves that shipped behavior and only fixes failure-path corruption.

## Bottom Line

OpenClaw is moving another routing decision from "attempted" to "proven." For operators, a failed message send should now stay a failed message send, without quietly rewriting the session's identity behind the scenes.
