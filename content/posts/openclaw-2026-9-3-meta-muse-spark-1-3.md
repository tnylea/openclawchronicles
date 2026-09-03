---
title: "OpenClaw Adds Meta Muse Spark 1.3 Models"
excerpt: "OpenClaw now supports Meta Muse Spark 1.3 and Muse Spark 1.3 Contributor, making 1.3 the default for new Meta setups."
coverImage: '/assets/images/posts/openclaw-2026-9-3-meta-muse-spark-1-3.png'
date: '2026-09-03T23:02:00.000Z'
dateFormatted: September 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-3-meta-muse-spark-1-3.png'
---

OpenClaw has added support for Meta's Muse Spark 1.3 models. PR [#136553](https://github.com/openclaw/openclaw/pull/136553), merged on September 3, updates the Meta provider catalog with `meta/muse-spark-1.3` and `meta/muse-spark-1.3-contributor`.

The change also makes Muse Spark 1.3 the onboarding default for new Meta setups while keeping existing Muse Spark 1.1 and 1.2 model configurations available.

## What Changed

Before this merge, OpenClaw's Meta provider catalog stopped at Muse Spark 1.2. Users with access to Muse Spark 1.3 could not select the newer Standard or Contributor model from OpenClaw, and onboarding still pointed new Meta configurations at the older default.

The PR adds both 1.3 model refs to the Meta plugin-owned catalog. It also updates documentation and tests with the model capabilities, context limits, pricing, ordering, and live-test coverage.

For day-to-day use, the practical result is simple:

- New Meta setups default to Muse Spark 1.3
- Standard users can select `meta/muse-spark-1.3`
- Contributor users can select `meta/muse-spark-1.3-contributor`
- Existing Muse Spark 1.1 and 1.2 routes remain supported

That gives Meta users access to the latest advertised Muse Spark generation without hand-editing around OpenClaw's provider catalog.

## Capabilities And Pricing

The PR says the model contract was verified against Meta's public documentation on September 2, 2026. According to the PR, Meta lists Muse Spark 1.3 as the latest version and recommended default, with a 1,048,576-token context window and text/image input support.

The same verification records Standard 1.3 pricing at $1.25 input, $0.15 cached input, and $4.25 output per million tokens. Contributor 1.3 pricing is listed at $0.10 input, $0.002 cached input, and $0.20 output per million tokens.

Those details matter because provider catalog changes are not just names in a menu. OpenClaw uses the catalog to present model options, order defaults, explain capabilities, and make pricing visible in the places where users choose routes.

## Why It Matters

OpenClaw's provider story depends on keeping external model catalogs current. When a provider releases a new default model, users expect the agent runtime, onboarding flow, and model picker to recognize it quickly.

This PR keeps the Meta integration aligned with the provider's current model lineup while preserving older routes. That is the right balance for users who want the new default and teams that need existing configs to remain stable.

It is also a useful reminder that OpenClaw's model catalog is part of the product surface. A stale catalog can make a working provider feel broken or outdated, especially when a user already has access to a newer model through the provider directly.

## Verification

The PR reports 24 passing Meta extension tests, 117 focused provider runtime and catalog tests, a passing changed-file gate, and a successful local plus isolated build. It also includes live proof through OpenClaw's Meta provider stream wrapper and Responses transport for both Muse Spark 1.3 model refs.

For Meta users, the upgrade is straightforward: after updating to a build that includes PR #136553, the new Muse Spark 1.3 options should appear in the model catalog and new Meta onboarding should prefer 1.3.

---

*PR [#136553](https://github.com/openclaw/openclaw/pull/136553) · merged September 3, 2026 · source: OpenClaw GitHub*
