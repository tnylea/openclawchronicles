---
title: "OpenClaw Adds Enterprise Architecture Docs"
excerpt: "OpenClaw adds a citable enterprise architecture page covering trust boundaries, policy-as-code, secrets, standards, governance, and claims."
coverImage: '/assets/images/posts/openclaw-2026-8-27-enterprise-architecture-docs.png'
date: '2026-08-27T08:15:00.000Z'
dateFormatted: August 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-27-enterprise-architecture-docs.png'
---

OpenClaw now has a new official enterprise-facing architecture page. Merged PR [#130709](https://github.com/openclaw/openclaw/pull/130709) adds `docs/start/why-openclaw.md`, a "Why OpenClaw" page intended to give evaluators a citable explanation of the platform's trust model, governance posture, and standards support.

This is documentation, not a runtime change, but it is still notable. As OpenClaw becomes part of more serious team and enterprise conversations, architecture claims need to be written down in a way that security reviewers can inspect and challenge.

## What The Page Covers

The PR says the new page is linked from the Get started Overview group and focuses on six testable properties of an enterprise agent harness. The listed topics include:

- Trust boundaries
- Policy-as-code
- Tiered identity
- Agent-blind secrets handling
- Versioned state
- Provenance, including the memory pipeline

It also adds an open standards section covering MCP in both directions, A2A 1.0, ACP in both directions, A2UI, AgentSkills, the OpenAI-compatible API, OpenTelemetry, and Prometheus.

For teams comparing agent platforms, that is useful context. It gives architects and security teams one official place to start before they dive into the deeper Gateway, policy, secrets, and plugin docs.

## Why It Landed

The PR frames the change around enterprise evaluation pressure. Maintainers had apparently been explaining OpenClaw's "trusted Gateway / untrusted execution" architecture in calls and chats, while third-party comparison posts filled gaps with stale or unverifiable claims.

The new page tries to replace ad hoc explanation with source-grounded documentation. It includes team workflows, governance and disclosure history, an explicit "What we do not claim" section, and a commit-pinned comparison with Hermes Agent.

That last detail is important. Comparative architecture pages can drift quickly. Pinning the comparison to a specific upstream commit gives readers a way to understand exactly what was inspected at the time the page was written.

## Verification Notes

The PR says comparative claims were checked in both source trees. It also says claims that failed verification were corrected or removed during drafting, including some claims that would have favored OpenClaw.

The evidence section lists docs validation across 792 MDX files, 6,810 internal links with zero broken, documentation formatting checks, and config-related source verification. The PR also reports measured counts rather than asserted counts for provider plugins, documented channels, public SDK entrypoints, and advisory data.

There is no runtime, config, or API change attached to this PR. The user impact is the new public docs page at `/start/why-openclaw` plus an aligned OpenShell policy config-description fix that had already been subsumed upstream.

## Bottom Line

OpenClaw's enterprise story is getting easier to cite. The new architecture page should help security reviewers, platform teams, and technical buyers understand the project's intended boundaries before they evaluate deployments, plugins, channels, and operator policy.
