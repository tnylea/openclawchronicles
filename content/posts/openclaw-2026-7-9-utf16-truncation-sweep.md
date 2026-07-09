---
title: "OpenClaw Hardens UTF-16 Truncation Paths"
excerpt: "OpenClaw is replacing raw string slicing in provider, audit, notification, and live-chat truncation paths with safer UTF-16 handling."
coverImage: '/assets/images/posts/openclaw-2026-7-9-utf16-truncation-sweep.png'
date: '2026-07-09T08:10:00.000Z'
dateFormatted: July 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-9-utf16-truncation-sweep.png'
---

OpenClaw merged a cluster of small hardening PRs after the July 8 nightly run that all point at the same problem: raw string truncation can split UTF-16 surrogate pairs and leave malformed text behind.

The most visible item is [PR #102496, "fix(agents): keep provider error detail truncation UTF-16 safe"](https://github.com/openclaw/openclaw/pull/102496). Related commits in the same window also covered tool-policy audit fields, Android notification previews, and live chat assistant buffer tails.

Individually, these are small fixes. Together, they show OpenClaw continuing a broader response-bounding campaign across agent, gateway, channel, and audit surfaces.

## The Bug Pattern

JavaScript strings are UTF-16 sequences. A character outside the basic multilingual plane, such as many emoji, can be represented as a surrogate pair. If code truncates with a raw `.slice(...)` at exactly the wrong boundary, it can keep only half of that pair.

That dangling surrogate is not just ugly output. It can produce malformed provider previews, confusing logs, broken notification text, or downstream serialization issues in places that expect valid text.

PR #102496 gives the simplest proof. A fixture puts an emoji at the default provider-error truncation boundary. The old implementation leaves a lone surrogate; the new `truncateUtf16Safe` path does not.

## Where OpenClaw Tightened It

The provider-error fix replaces raw slicing in `src/agents/provider-http-errors.ts` so provider error previews stay valid even when an emoji lands on the edge of the configured limit.

The same morning window also included:

- [PR #102464](https://github.com/openclaw/openclaw/pull/102464), which applies safe truncation to tool-policy audit field values.
- [PR #102442](https://github.com/openclaw/openclaw/pull/102442), which keeps forwarded Android notification titles and message previews valid at the 512-code-unit limit.
- [PR #102484](https://github.com/openclaw/openclaw/pull/102484), which keeps live chat assistant buffer tail truncation UTF-16 safe.

The surfaces differ, but the safety rule is the same: enforce the byte or character budget without creating invalid text at the boundary.

## Why It Matters

OpenClaw has many bounded-output paths. Provider errors need caps so remote responses cannot flood the UI. Audit fields need caps so records stay readable and predictable. Mobile notifications and live chat buffers need caps so channel surfaces do not overrun their limits.

Those caps are good. The hard part is making sure truncation remains text-aware rather than just index-aware.

This is especially relevant for a global, chat-heavy assistant runtime. User names, provider errors, messages, notifications, and copied content can include emoji and non-Latin scripts. Safe truncation should be the default behavior in every edge-facing path.

## Validation

PR #102496 reports a focused Vitest run for `provider-http-errors.test.ts` with 14 passing tests. The regression test places an emoji at the default boundary and asserts that the formatted detail contains no lone surrogates.

PR #102442 reports Android notification sanitizer coverage and ktlint passing through a Blacksmith Testbox run. Its proof covers both sides of the boundary: a split pair is removed, while a complete pair ending at the limit is preserved.

The tool-policy audit PR includes a before-and-after proof showing raw slicing leaving a dangling high surrogate and `truncateUtf16Safe` producing clean output.

## Bottom Line

This is the kind of hardening that rarely makes a splash but improves the whole system. OpenClaw is replacing brittle truncation with text-aware truncation in more places, which makes provider errors, audit logs, notifications, and chat buffers safer for real-world multilingual input.
