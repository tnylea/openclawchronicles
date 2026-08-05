---
title: "OpenClaw Scopes Skill Verdicts By Publisher"
excerpt: "OpenClaw PR #119672 keeps installed ClawHub skill security verdicts tied to the exact trusted publisher, slug, and version."
coverImage: '/assets/images/posts/openclaw-2026-8-5-skill-verdict-publisher-scope.png'
date: '2026-08-05T23:01:00.000Z'
dateFormatted: August 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-5-skill-verdict-publisher-scope.png'
---

OpenClaw merged [PR #119672, "fix(skills): keep installed verdicts scoped to publisher"](https://github.com/openclaw/openclaw/pull/119672), a ClawHub security-boundary fix for installed skill verdicts in Control UI.

The issue sat in the passive verdict path. OpenClaw already recorded trusted publisher provenance for installed skills, but a later batch-verdict read could key UI state only by registry, slug, and version. If another publisher used the same slug and version, the installed detail view could lose or misattribute the verdict that belonged to the exact installed package.

That matters because skill names are not enough. In a public registry, the security question is not only "what is this slug?" It is also "who published the thing I installed, and does this verdict describe that exact artifact?"

## Exact Publisher Identity

PR #119672 carries `ownerHandle` through target collection, the shared exact-skill verdict resolver, Gateway projection, Control UI keys, and the installed-skill detail view.

The result is more explicit provenance in the UI. Installed overviews can render complete references such as `@openclaw/agentreceipt@1.2.3`, and the security state is associated with that owner-qualified identity instead of a looser slug-version pair.

The resolver is intentionally shared with the install and update trust path. That keeps passive reads aligned with the same exact-owner matching used when OpenClaw decides whether a skill is safe to install or update.

## Fail-Closed Registry Behavior

The PR also handles mixed registry behavior conservatively. New ClawHub API support for owner-aware verification landed first in [openclaw/clawhub#3409](https://github.com/openclaw/clawhub/pull/3409). Older or custom registries remain compatible through OpenClaw's exact `/verify` fallback when a skill is not found.

The important part is what happens when data does not line up. A malformed, reordered, mismatched, or legacy response can no longer silently attach another publisher's clean verdict to the installed skill. Publisher and exact-version mismatches fail closed.

Passive reads still stay unauthenticated and limited to the configured registry. Unrelated installed registry records remain skipped, so this is not a broadening of registry access.

## User Impact

Operators get a more trustworthy installed-skill page. When they inspect a skill's verdict, OpenClaw now preserves the publisher identity that mattered at install time and uses that same identity during later verdict refreshes.

For teams using ClawHub in production, this closes an uncomfortable ambiguity. Registry ecosystems naturally accumulate overlapping names, forks, mirrors, and similarly named packages. A security verdict needs to attach to the artifact that is actually present on the machine.

The Gateway field added for owner identity is optional, so older clients and registries are not forced through a protocol break. The change is additive, but the matching rule is stricter where it counts.

## Evidence

The PR includes focused regression proof across the ClawHub security resolver, skill lifecycle, Gateway methods, Control UI skill index, and installed-skill detail view. The reported validation passed 273 Vitest tests across six files.

For OpenClaw's broader direction, this is a small but important hardening step. The project has been moving ClawHub from a convenient catalog toward a trust-aware software supply chain. Owner-qualified verdicts are part of making that chain inspectable after installation, not just during the first install prompt.
