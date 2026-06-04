---
title: "OpenClaw Is 2.9x Faster and 59% Smaller Since February"
excerpt: "OpenClaw's official performance sweep reveals cold agent turns are 2.9x faster and the published tarball is 59% smaller than its March 2026 peak."
coverImage: '/assets/images/posts/openclaw-2026-5-29-faster-smaller-leaner.webp'
date: '2026-05-29T08:05:00.000Z'
dateFormatted: May 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-29-faster-smaller-leaner.webp'
---

The OpenClaw team published a [performance retrospective](https://openclaw.ai/blog/lighter-core-sharper-claws) on May 28th that puts concrete numbers behind months of quiet optimization work. The headline: **cold agent turns are 2.9x faster**, the **published tarball is 59% smaller**, and dependency count has dropped 42% from its peak — with more coming in the next release.

## The Numbers

The improvements span cold turn latency, warm turn latency, memory footprint, and package size:

| Metric | Before (v2026.4.14) | Now (v2026.5.27) | Improvement |
|--------|----------------------|------------------|-------------|
| Cold agent turn | 9.8s | 3.4s | **2.9x faster** |
| Warm agent turn | 7.5s | 3.0s | **2.5x faster** |
| Agent peak RSS | 686 MB | 635 MB | **7% lower** |
| Published tarball | 43.3 MB (March peak) | 17.8 MB | **59% smaller** |
| Installed dependencies | 645 (Feb peak) | 371 | **42% reduction** |

These aren't micro-benchmark claims — the OpenClaw team is careful to note that each data point represents a single smoke run, useful for spotting large regressions rather than precision tuning. But the trend across four months is unmistakable.

## How the Package Shrank

The story behind the tarball size is worth understanding. OpenClaw's npm package grew from 82.9 MB unpacked to 182.6 MB unpacked through early 2026 as channels, providers, media, memory, and plugin SDK surface were added. That's expected growth for an expanding platform.

The reversal started in **v2026.5.12**, when the team began moving heavier plugin dependency cones out of core. Bedrock, Slack, OpenShell, Anthropic Vertex, Matrix, and WhatsApp all moved out of the core dependency path into separate plugin packages. This is the right architectural direction: keep core small, move optional capabilities into plugins.

**v2026.5.22** exposed a problem — the shrinkwrap system materialized a large nested tree with every canvas platform package, causing the fresh install footprint to spike to 1,020 MB. The v2026.5.27 release fixed the package shape (cutting it to 786.9 MB on fresh install), though a shrinkwrap-exposed duplicate tree is still visible. That duplicate is already removed on `main` for the next release.

## Dependency Count: 645 → 314

The dependency count reduction is the clearest signal of sustained architectural discipline. OpenClaw peaked at 645 installed dependencies in February 2026. v2026.5.27 ships with 371. The `main` branch is already down to **314** — meaning the next release will continue the trend.

Fewer dependencies means a smaller attack surface for [Shrinkwrap](https://docs.openclaw.ai/gateway/security/shrinkwrap) audits, faster installs, and fewer surprise transitive breakages when upstream packages update.

## What This Means for Self-Hosters

If you run OpenClaw on a Raspberry Pi, a constrained VPS, or a home server with limited RAM, these numbers matter in practice. A cold turn dropping from 9.8 seconds to 3.4 seconds makes the assistant feel meaningfully more responsive. An agent process using 51 MB less peak RSS matters on a 1 GB droplet.

The team is explicit that the direction is "keep core small, move optional capabilities into plugins, make dependency ownership explicit, and measure the user-visible effects." For the self-hosting community, that translates to a runtime that gets faster and lighter with each release rather than heavier.

## The Technical Report

The full methodology, per-release data rows, caveats, and the shrinkwrap boundary audit are in the [technical report on docs](https://docs.openclaw.ai/reference/release-performance-sweep). If you're evaluating OpenClaw for a production deployment or want to understand exactly how these measurements were taken, that document is worth reading before drawing conclusions.

The blog post closes with a line that captures the philosophy well: *"Growth, here, looks more like molting than adding."*
