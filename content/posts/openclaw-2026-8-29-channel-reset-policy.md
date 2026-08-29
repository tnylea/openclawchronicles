---
title: "OpenClaw Restores Channel-Authorized Reset Commands"
excerpt: "OpenClaw now lets admitted non-owner channel users run reset commands again while preserving explicit denials and owner-only policies."
coverImage: '/assets/images/posts/openclaw-2026-8-29-channel-reset-policy.png'
date: '2026-08-29T08:02:00.000Z'
dateFormatted: August 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-29-channel-reset-policy.png'
---

OpenClaw merged a user-facing channel command fix just before the August 29th morning cutoff. [PR #125618](https://github.com/openclaw/openclaw/pull/125618), merged at 07:57 UTC, restores `/new` and `/reset` for channel-authorized users on plugins that do not enforce owner-only commands.

The bug appeared when an operator configured a separate `commands.ownerAllowFrom` list. In that state, admitted channel users could be blocked from reset commands even though the channel itself was not owner-enforced. The PR names Feishu/Lark as the reported case and notes that the same shared-policy defect also affected Buzz.

## Reset-Only Access Gets A Clear Owner

The fix moves command authorization back to one closed decision: denied, reset-only, or ordinary command access. Session initialization, archived-session admission, and reset handling consume that decision directly, instead of reconstructing policy in separate downstream branches.

That design is important because reset access is narrower than general command access. The PR explicitly says reset-only access does not grant ordinary command authority or owner status. It also preserves explicit `commands.allowFrom` denials, including the case where an empty provider-specific list overrides a wildcard global list.

In other words, OpenClaw restores the reset workflow without turning it into a broader permission grant.

## The Plugin Boundary Stays Intact

Owner-enforcing plugins still enforce owner policy. Internal Gateway scope requirements still apply. Published SDK authorization types and runtime authorization object keys remain unchanged. The slash-command documentation was updated to explain reset-only admission and to correct a misleading example around `enforceOwnerForCommands`.

The PR also explains why the repair avoids a raw-admission fallback. A fallback like that could reopen explicit allowlist bypasses. Keeping the reset decision inside the existing command-authorization owner lets OpenClaw fix the regression while preserving the security shape operators expect.

## What Users Should Notice

For a channel user who is admitted by policy, `/reset` and `/new` should work again on non-owner-enforcing channels. For example, a Buzz room or Feishu peer that is already admitted can reset its selected session without asking the model to infer anything and without mutating another account or room.

The important behaviors are:

- Admitted senders regain `/new` and `/reset`.
- Explicit deny lists still deny the command.
- Owner-only plugin policy still wins where configured.
- Reset-only users do not become full command owners.
- Feishu peer routing and Buzz room routing stay scoped.

The evidence is unusually broad for a command-policy fix. The PR reports 533 tests across nine files for command ownership, reset hooks, session cleanup, prompt behavior, SDK authorization, provider resolution, and durable session lifecycle. It also includes a real Buzz before/after proof against the official service, with signed events from admitted non-owner accounts and zero model requests for the reset commands.

This is a practical repair for OpenClaw teams that delegate channel access without making every admitted sender an owner. The reset command is back where it belongs: available to admitted users when the channel allows it, but still bounded by explicit denial and owner-enforcement rules.
