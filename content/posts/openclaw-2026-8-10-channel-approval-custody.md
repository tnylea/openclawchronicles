---
title: "OpenClaw Locks Approval Requests to Channel Accounts"
excerpt: "OpenClaw approval requests now stay bound to their owning channel account, reducing duplicate delivery and copied-ID execution risk."
coverImage: '/assets/images/posts/openclaw-2026-8-10-channel-approval-custody.png'
date: '2026-08-10T23:02:00.000Z'
dateFormatted: August 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-10-channel-approval-custody.png'
---

OpenClaw's channel approval flow received a major custody hardening tonight with [PR #121673](https://github.com/openclaw/openclaw/pull/121673). The P1 fix keeps native exec and plugin approvals tied to the channel account that owns the request route.

Before this change, approvals without an account binding could appear on every eligible account for the same channel. Worse, a copied approval ID could be resolved through an account that did not own the original request route.

## What changed

The merged PR gives native approval routing and resolution one shared account-custody contract. Channel controls now carry a closed reviewer identity made from channel, account, and sender facts. The Gateway checks that identity against the live approval request and a current config snapshot immediately before the existing resolution compare-and-swap.

That means visibility alone is no longer enough. A list filtered on the client cannot become an authorization decision, and a delivery runtime going offline cannot silently disable same-account manual approval.

The PR also snapshots raw eligible native runtimes once per approval and channel. Bound or explicitly targeted accounts still work as a union. An unbound route selects only its sole live candidate, and ambiguous multi-account cases produce one visible manual-approval outcome instead of letting a late runtime duplicate or steal delivery.

## Why this matters for multi-account operators

OpenClaw runs in the messy real world: multiple Slack workspaces, several Telegram bots, Discord servers, Matrix rooms, web UI controls, and plugin-originated approvals can all coexist.

In those environments, approval prompts are not just notifications. They are authority-bearing controls. If an approval shows up on the wrong account, or if a copied ID resolves through the wrong account, the operator loses a clear boundary between "who saw the prompt" and "who may act on it."

This fix makes that boundary explicit. Operators with several bots or workspaces on one channel should now see approval commands only on intended accounts. Explicit multi-account forwarding still works, but copied IDs and buttons from unrelated accounts fail instead of executing the request.

## Proof and scope

The PR landed with a broad test surface: 215 focused tests across Gateway custody, shared native runtime coordination, Discord, Telegram, Matrix, QQBot, and Slack. A second focused proof covered 135 resolver, Gateway custody, and command tests, including incomplete reviewer shapes that fail before Gateway I/O.

The PR also documents exact-head Telegram behavior using a real QA user, a SUT bot, and a deterministic second Telegram account on the same candidate Gateway. The owning account emitted one approval card. The second account emitted no approval card, and its copied `/approve` attempt returned the expected unknown-or-expired result.

This was a large patch: +315 net production lines, with client-side preflight and several plugin-local configured-sibling scans removed. The positive growth establishes two new owners that prior inference could not represent cleanly: Gateway-atomic reviewer custody and a sticky per-request native-delivery candidate snapshot.

## The bigger pattern

The approval system is becoming less optimistic and more explicit. That is a good trade for a personal agent runtime where buttons can authorize file access, native tools, and plugin actions.

OpenClaw now has a stronger answer to a simple operational question: did this account own the approval it is trying to resolve? After PR #121673, the Gateway checks that answer at the point that matters.
