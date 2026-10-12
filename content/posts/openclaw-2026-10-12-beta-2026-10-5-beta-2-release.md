---
title: "OpenClaw 2026.10.5 Beta 2 Tightens Recovery"
excerpt: "OpenClaw 2026.10.5 beta 2 lands with safer updates, stronger Doctor recovery, tool approval hardening, and steadier Control UI turns."
coverImage: '/assets/images/posts/openclaw-2026-10-12-beta-2026-10-5-beta-2-release.png'
date: '2026-10-12T23:01:00.000Z'
dateFormatted: October 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-12-beta-2026-10-5-beta-2-release.png'
---

OpenClaw published [v2026.10.5-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.10.5-beta.2) today, and it is a dense beta for people running long-lived Gateways, paired devices, plugins, and unattended update paths.

The release follows this morning's stable 2026.10.2 coverage, but it is not just another tag on the same work. The beta channel is collecting several boundary fixes around updates, Doctor recovery, tool approvals, subagent provenance, and Control UI durability.

## Updates Keep More State Intact

The headline is update recovery. The release notes say `openclaw update` now settles stale handoff leases, completed receipts, and older recovery records instead of stopping on `update-recovery-pending`.

That matters because OpenClaw updates are not a simple binary swap. A Gateway may have webhook listeners, service heap limits, device state, plugin metadata, and running conversations in play. A conservative updater has to avoid making a bad state worse, but it also has to avoid stranding a healthy install because of stale bookkeeping.

This beta aims at that middle path. The notes call out Windows short-name path handling, preservation of service heap limits and webhook listeners, and fewer cases where accepted handoffs or successful updates are reported as failures.

## Doctor Gets More Careful With Data

Doctor also gets a meaningful recovery pass. The release notes describe preservation of installed plugin configuration when path-safety checks block a plugin, plus a stricter stance toward malformed UTF-8 root memory files: leave them alone rather than importing uncertain bytes into a repaired state.

Recovery copies now capture Canvas and Memory Core files before migrations move them, including installs without configured agents. That detail is easy to skim past, but it is important operationally. Recovery tools should preserve evidence before they normalize state, especially when the broken install may be the only copy of a user's data.

## Tool Approvals Get A Sharper Boundary

The security-sensitive item in the beta is tool approval hardening. The release says hooks can no longer change tool arguments after a trusted inline approval without requiring another approval, and transforming plugins must request approval for their final arguments.

The practical rule is simple: the thing the user approved should be the thing that runs. If a hook or plugin changes arguments after approval, that is a new execution shape and it needs its own approval boundary.

The migration target is documented in [`docs/plugins/hooks/tool-policy.md`](https://github.com/openclaw/openclaw/blob/main/docs/plugins/hooks/tool-policy.md), which is the right place for plugin authors to start before this behavior moves closer to stable.

## Subagents And Control UI Become Less Fragile

The beta also improves subagent message provenance. Inter-session messages retain the `[Inter-session message]` safety envelope across initial delivery and replay, so parent-sent instructions are not later presented to a child session as direct user instructions.

Control UI turns also keep running through ordinary pairing activity such as node heartbeats, other devices updating, and tab reconnects. Real revocations still stop affected work. That distinction is the whole point: routine device churn should not look like a security revocation, while actual revocation still needs to win.

## Why This Beta Matters

OpenClaw's recent release train has been about reducing weird failure modes at boundaries: update handoffs, device pairing, plugin transforms, memory repair, and inter-session messaging. Beta 2 continues that theme with a bias toward data preservation and explicit authority.

For most stable users, 2026.10.2 remains the safer channel. For beta testers and operators tracking the next recovery/security bundle, 2026.10.5-beta.2 is the tag to read closely.
