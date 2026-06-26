---
title: "OpenClaw Tightens Telegram and Weixin Routing"
excerpt: "OpenClaw fixed two P1 channel routing bugs covering Telegram spooled claims and Weixin account resolution for more reliable messaging."
coverImage: '/assets/images/posts/openclaw-2026-6-26-telegram-weixin-routing.png'
date: '2026-06-26T08:02:00.000Z'
dateFormatted: June 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-26-telegram-weixin-routing.png'
---

OpenClaw's morning channel work landed in two high-priority merged PRs: [PR #96962, "Fix Telegram spooled claim refresh"](https://github.com/openclaw/openclaw/pull/96962), and [PR #93686, "fix(weixin): startAccount preserves session routing"](https://github.com/openclaw/openclaw/pull/93686).

Both fixes deal with the same broad promise: when a channel has a valid message or account route, OpenClaw should preserve that route through startup, queueing, and long-running agent work.

## Telegram Claims Stay Fresh

Telegram polling can spool inbound updates into OpenClaw's shared ingress queue before dispatching them to the runtime. The failure mode in PR #96962 appeared when a long-running Telegram turn held a claimed ingress event past the stale-claim recovery window.

Without refreshing the active claim, another poll loop could decide the still-active row was stale. That opened the door to duplicate recovery, redispatch, or a wedged message while the original model turn was still processing.

The fix adds token-guarded optional claim refresh support to the message ingress queue, wires Telegram spool refresh into the Telegram extension, and refreshes active or deferred Telegram spooled claims while the runtime is processing the update. It also adds a Telegram status and backlog diagnostic so operators can separate genuinely stuck backlog from normal in-flight work.

The user-facing result is straightforward: long-running Telegram turns should no longer be treated as stale while they are still active.

## Weixin Accounts Resolve Correctly

PR #93686 fixes a different routing edge. Manifest channel account listing normalized raw config keys into route-safe IDs, but account resolution looked up the normalized ID directly in the raw `accounts` object.

That could break an external Weixin account before startup. A raw key such as `59000514e8ad@im.bot` could be listed as a route-safe ID, then fail to resolve when `startAccount` tried to use it.

The PR makes manifest account resolution use the same normalized account lookup invariant as listing. It also tightens fallback matching so invalid config-map candidate keys cannot collapse into `default` through normalization.

## Why It Matters

Channel reliability is not just about sending a message once. OpenClaw has to preserve identity across adapters, queues, account manifests, stale-claim recovery, and long model turns.

These two fixes target different layers of that chain:

- Telegram now keeps in-flight spooled messages from being mistaken for abandoned work.
- Weixin now resolves route-safe account IDs back to their raw configured accounts before startup.

Both PRs were labeled P1 with sufficient proof. Telegram also carried `merge-risk: session-state` and `merge-risk: message-delivery`, which fits the operator impact: a channel can look configured correctly but still lose, duplicate, or stall messages if routing state drifts.

## What Operators Should Notice

Fast Telegram turns should behave as before. The difference appears during longer turns and backlog recovery, where OpenClaw should keep the active claim alive instead of treating it as stale.

For Weixin, correctly configured external accounts should be less likely to disappear before startup because the manifest resolver now follows the same account ID contract as the lister.

Together, the changes continue a clear OpenClaw trend: channel fixes are moving from surface-level send errors toward deeper identity preservation across the full message lifecycle.
