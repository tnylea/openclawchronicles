---
title: "OpenClaw Brings Durable Approvals To Mobile"
excerpt: "OpenClaw now lets authorized operators review durable Gateway approvals from Android, iPhone, and Apple Watch without stale success states."
coverImage: '/assets/images/posts/openclaw-2026-7-12-mobile-approval-review.png'
date: '2026-07-12T08:02:00.000Z'
dateFormatted: July 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-12-mobile-approval-review.png'
---

OpenClaw's mobile clients can now review durable Gateway approvals, extending a core operator workflow beyond Control UI and chat channels.

The merged pull request, `feat(apps): review durable approvals on mobile`, covers Android, iPhone, and Apple Watch. The practical goal is simple: if OpenClaw asks whether an action should run, authorized operators should be able to answer from the device in front of them, and every surface should agree on the recorded result.

Source: [OpenClaw PR #104913](https://github.com/openclaw/openclaw/pull/104913)

## The Approval Record Is The Source Of Truth

Before this change, native mobile surfaces could not reliably review the same Gateway approval shown in Control UI or a chat channel. The PR describes cases where lost acknowledgements left native cards looking actionable, or resolved without canonical proof. Switching Gateways could also misroute stale approval state.

The fix moves the official mobile clients onto the durable Gateway approval record. Android and iPhone use kind-aware unified RPCs, while Apple Watch relays reviewer-safe exec prompts through the paired iPhone. Each client treats Gateway terminal state as authoritative.

That last point is important. Mobile approval UI should not decide that something succeeded merely because a local tap appeared to go through. It needs readback from the canonical runtime record.

## First Authorized Answer Wins

The user-facing behavior is straightforward. Authorized operators can review pending exec approvals from Android, iPhone, or Apple Watch. The first answer from an authorized surface wins, and all native surfaces display the recorded result.

The implementation preserves approval and Gateway IDs as opaque exact identifiers, binds credentials and cached prompts to the selected Gateway, and freezes ambiguous writes until canonical readback. A bounded legacy exec-method fallback keeps compatibility with shipped Gateway v4 peers.

For day-to-day use, that should reduce a class of annoying and risky approval ambiguity:

- A reconnect should not fabricate approval success.
- A lost response should not reopen execution rights.
- A stale Gateway selection should not approve the wrong target.
- A Watch card should show loading or unavailable state instead of pretending an approval is clear.

## Mobile Is Becoming An Operator Surface

This fits a larger OpenClaw direction. Mobile apps are not just notification mirrors anymore; they are becoming control surfaces for agent operations. That makes approval correctness more important, not less.

Approving from a watch is convenient, but convenience cannot come at the cost of authority binding. The interesting part of this PR is that the mobile workflow is tied back to the same durable Gateway record used elsewhere.

## Verification

The PR reports Android unit suite and ktlint coverage, native app internationalization tests, a Watch target build and simulator launch on watchOS 26.5, and focused iOS approval coverage. It also notes two unrelated current-main iOS failures outside the changed sources.

There is still a manual paired iPhone and Watch release recipe for the full physical-device interaction, but the direction is clear: OpenClaw approvals are moving toward a single durable record that can be reviewed from whichever authorized surface the operator actually has in hand.
