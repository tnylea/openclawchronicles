---
title: "OpenClaw Moves Model Pricing to Hosted Catalog"
excerpt: "OpenClaw now resolves model pricing from its hosted catalog, reducing gateway-side network work while preserving explicit costs and local endpoint privacy."
coverImage: '/assets/images/posts/openclaw-2026-7-26-hosted-model-pricing.png'
date: '2026-07-26T08:00:00.000Z'
dateFormatted: July 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-26-hosted-model-pricing.png'
---

OpenClaw's model cost estimates are moving out of every individual Gateway process and into the hosted model catalog. The change landed in [PR #114060](https://github.com/openclaw/openclaw/pull/114060), a P1 compatibility update that removes the old client-side pricing bootstrap and centralizes pricing refreshes alongside model discovery.

The practical goal is simple: a Gateway should not need to contact third-party pricing sources just to estimate usage costs when the hosted catalog is already refreshed centrally.

## What Changed

Before this merge, each Gateway could fetch OpenRouter and LiteLLM pricing directly. That duplicated network traffic and created extra moving parts for configuration, caching, health reporting, and failure handling.

The new catalog schema carries provider model costs plus a compact fallback pricing map for source models that are not represented by provider rows. At runtime, OpenClaw resolves prices in this order:

- The merged bundled and remote hosted catalog.
- Explicit configured or per-agent costs.
- Hosted fallback pricing for source models.
- Unknown pricing when no trusted source has a value.

Private and local endpoints remain outside the hosted pricing path, which matters for operators running their own model infrastructure.

## Why It Matters

This is not just cleanup. Usage costs sit close to trust and predictability: users need estimates to be consistent, and operators need failures to be fail-soft instead of turning every Gateway into another pricing crawler.

The PR removes the old `models.pricing` setting, and `openclaw doctor --fix` now handles the retired config key. Users who disable hosted catalog refreshes through `models.catalogRefresh.enabled=false` still keep bundled and explicitly configured values.

The hosted publisher also preserves OpenRouter and LiteLLM alias handling, emits deterministic JSON, and reports both fallback-entry count and bundle size during publish.

## Verification

The PR reports a live publisher smoke test covering 39 providers, 217 models, 212 cost models, 40 enriched pricing rows, and 11,691 pricing entries. It also lists 844 focused assertions across catalog publishing, fallback resolution, private endpoints, Doctor migration, session cost formatting, Gateway lifecycle, health/status, and security surfaces.

Build validation passed through `node scripts/check-changed.mjs` and `pnpm build`, with autoreview reporting no accepted actionable findings.

For OpenClaw operators, the upgrade should make cost metadata feel less scattered: pricing now follows the catalog rather than every Gateway maintaining its own copy of the public pricing workflow.
