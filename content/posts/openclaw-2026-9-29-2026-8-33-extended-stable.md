---
title: "OpenClaw 2026.8.33 Extends Stable Gateway"
excerpt: "OpenClaw 2026.8.33 refreshes the extended-stable Gateway line with security fixes, model support, and reliability backports for cautious operators today."
coverImage: '/assets/images/posts/openclaw-2026-9-29-2026-8-33-extended-stable.webp'
date: '2026-09-29T08:00:00.000Z'
dateFormatted: September 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-29-2026-8-33-extended-stable.webp'
---

OpenClaw published [v2026.8.33](https://github.com/openclaw/openclaw/releases/tag/v2026.8.33) early Tuesday, adding a new Gateway-only extended-stable release for operators who want a slower line than the current `2026.9.x` builds.

The release notes describe extended-stable as OpenClaw's current LTS-equivalent lane. This cut is based on OpenClaw from the end of August 2026, then layered with selected security updates, reliability fixes, performance work, and model-support backports. The latest regular release remains `v2026.9.6`, so `v2026.8.33` is not a newer feature train. It is a maintained alternative for deployments that value a narrower upgrade surface.

## What Changed

The headline item is that the extended-stable Gateway now carries several current model integrations without forcing operators onto the newest September line.

The release notes call out support for:

- Meta Muse Spark 1.3.
- Anthropic Fable 5.1.
- OpenAI GPT-6 Astra.
- OpenAI and fal GPT Image 2.5.
- GPT-5.6 Sol, Terra, and Luna continuity across catalog, routing, image, vision, and thinking paths.

That matters for teams running a conservative Gateway build while still needing access to current model catalogs. The backports also include Bedrock tool-result image handling and Ultra reasoning behavior across model-runtime boundaries.

## Security Rollup

The security portion is the clearest reason to pay attention. OpenClaw says this extended-stable release reconciles repository advisories affecting `2026.8.2`, hardens Prometheus metrics authorization, tightens Discord asset and voice ownership behavior, and clears the production Nodemailer advisory gate.

Individual fixes include:

- Rejecting Prometheus metric scrapes without the configured operator-read scope.
- Enforcing sender media policy for Discord guild asset uploads.
- Preserving Discord speaker and playback ownership across voice lifecycle transitions.
- Moving the IMAP dependency graph to Nodemailer 9.1.1 to clear address-parser denial-of-service and related advisories.

Those are not cosmetic changes. They sit directly on monitoring access, media ownership, voice ownership, and dependency security, which are exactly the areas self-hosted Gateway operators should be careful about when they defer major upgrades.

## Reliability Fixes

The release also includes several operational repairs. Doctor now preserves explicitly enabled skills during automatic updates. Generated images are retained when a later tool call fails. Matrix verification refreshes device trust state before reporting it. Discord consult cancellation records host-cancelled realtime consults as cancellations instead of falling into a generic error path.

There is also an iOS release-validation dependency update after a WebRTC binary artifact was withdrawn. That is mostly packaging hygiene, but it is the kind of maintenance that keeps a long-lived release line installable.

## Who Should Use It

`v2026.8.33` is most relevant if you are pinned to the August Gateway line and want security and reliability fixes without adopting the latest `2026.9.x` release.

If you are already on the September stable line, this release is context rather than an upgrade target. The release notes explicitly point readers to `2026.9.6` as the current latest version of OpenClaw.

For conservative deployments, though, this is a meaningful maintenance cut: newer model support, security rollups, and targeted Gateway reliability work, all packaged for the extended-stable lane.
