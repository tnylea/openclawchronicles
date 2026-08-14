---
title: "OpenClaw Blocks Exec Approval Leakage"
excerpt: "OpenClaw now rejects foreign-channel fallback routing so exec approval prompts do not leak into the wrong Telegram account."
coverImage: '/assets/images/posts/openclaw-2026-8-14-exec-approval-leak.png'
date: '2026-08-14T08:01:00.000Z'
dateFormatted: August 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-14-exec-approval-leak.png'
---

OpenClaw merged a high-priority approval-routing fix this morning in [PR #122517](https://github.com/openclaw/openclaw/pull/122517), titled "fix(approvals): prevent cross-channel exec approval leak to Telegram." The PR says a foreign-channel exec approval could fall through native approval routing and reach Telegram when Telegram had the only eligible account.

That is exactly the kind of boundary operators expect OpenClaw to get right. Exec approvals are authority prompts. They should stay with the channel and account that owns the turn, not drift toward whichever native client happens to be available.

## What Went Wrong

The root cause was a fallback inside `doesApprovalRequestSelectChannelAccount`. According to the PR, the selector already preferred recorded account bindings and configured forwarding targets, but its final sole-account fallback ignored a conflicting `turnSourceChannel`.

In practice, that meant an approval originating from one channel could be shown in Telegram if Telegram was the only otherwise eligible native account. The PR's evidence includes a pre-fix reproduction where a Gateway approval request declaring `turnSourceChannel: "whatsapp"` produced a Telegram approval message.

This was not a broad redesign of approval policy. It was a narrow owner-boundary failure: the system knew the source channel, but one unbound fallback path treated sole-account availability as enough to select Telegram anyway.

## The Fix

The merged change rejects only the unbound foreign-channel fallback at the shared approval-account owner boundary. Recorded bindings still win, and explicit forwarding targets still work. That distinction matters because OpenClaw operators may intentionally route approvals through a configured target, but an implicit fallback should not invent cross-channel authority.

The PR also adds Telegram and Matrix regression coverage around the shared contract. The author notes that no provider-specific policy was added, which keeps the rule in the common approval-selection layer instead of scattering special cases across channel integrations.

The resulting behavior is easier to reason about:

- Bound approval accounts remain valid.
- Explicit forwarding remains valid.
- A conflicting source channel blocks the sole-account fallback.
- Telegram and Matrix now encode the same owner-boundary expectation.

## Why This Is Security-Relevant

OpenClaw frames this as a high-priority user-facing bug with message-delivery and compatibility risk labels. The security angle is straightforward: an exec approval prompt is an authority transfer. If it appears in the wrong channel, a user can approve something without the surrounding context that produced the request.

Even when no secret is directly exposed, approval misrouting can create a confusing and unsafe operating model. Humans make decisions based on the conversation they are looking at. The channel boundary is part of that decision context.

## The Bottom Line

[PR #122517](https://github.com/openclaw/openclaw/pull/122517) tightens OpenClaw's approval routing by refusing an unsafe fallback rather than guessing. For multi-channel operators, especially those using Telegram alongside other chat surfaces, this is a meaningful hardening update: exec approval prompts now stay bound to the channel authority that produced them.
