---
title: "OpenClaw Moves Amazon Bedrock to an External Provider Plugin"
excerpt: "Amazon Bedrock and Bedrock Mantle are being separated from the OpenClaw core bundle, requiring a separate npm install for Bedrock users going forward."
coverImage: '/assets/images/posts/openclaw-2026-5-14-bedrock-providers-external.png'
date: '2026-05-14T08:00:00.000Z'
dateFormatted: May 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-14-bedrock-providers-external.png'
---

OpenClaw is making another modularity move: Amazon Bedrock and its Bedrock Mantle variant are heading out of the core bundle and into their own installable npm packages — a change that will affect any deployment routed through Amazon's AI infrastructure.

[PR #81687](https://github.com/openclaw/openclaw/pull/81687), opened by core maintainer steipete, removes both `@openclaw/amazon-bedrock-provider` and `@openclaw/amazon-bedrock-mantle-provider` from the root package dependencies. After this lands, users who rely on Bedrock for their AI workloads will need to explicitly install the provider packages before use.

## What's Changing

Currently, Bedrock support ships bundled into the core OpenClaw install — you get it whether you use it or not. The PR restructures this:

- **`@openclaw/amazon-bedrock-provider`** — Standard Amazon Bedrock access via the AWS SDK, now an external package
- **`@openclaw/amazon-bedrock-mantle-provider`** — The Bedrock Mantle variant (using the Anthropic SDK + token generator), also externalized

The AWS and Anthropic SDK dependencies move with their respective packages, meaning a default OpenClaw install no longer pulls them in for users who don't need them.

## Why OpenClaw Is Doing This

This follows the same externalization pattern OpenClaw already applied to WhatsApp in the `v2026.5.12-beta.5` release. The logic is consistent: heavy provider-specific dependencies have no business living in the core bundle for users who don't use those providers.

Amazon's SDK stack isn't small. By moving those dependencies to a separately installable package, OpenClaw reduces install size and eliminates potential dependency conflicts for the majority of users running OpenAI, Anthropic, or Google models directly. It's part of a broader push to keep the core lean and composable.

## What You Need to Do

For most users, nothing changes. If you're not using Amazon Bedrock as your AI backend, this PR is entirely invisible to your setup.

But if your OpenClaw instance routes through Bedrock — whether for Claude on AWS, Bedrock Mantle, or a custom Bedrock endpoint — you'll need to add an explicit install step once this ships:

```bash
openclaw plugins install @openclaw/amazon-bedrock-provider
# or for Bedrock Mantle
openclaw plugins install @openclaw/amazon-bedrock-mantle-provider
```

Existing installs may handle this automatically if your setup was provisioned through the Bedrock-specific onboarding flow, but it's worth verifying before the next beta drops.

## An AI Code Review Caught One Doc Gap

One wrinkle: an automated Codex code review on the PR flagged that the existing provider setup docs still describe Bedrock as bundled or requiring no install step. That creates a gap where users following the old documentation could run `openclaw models list` on a fresh install and not understand why Bedrock isn't available.

The docs are being updated alongside the PR — the review flagged it as a P2 finding, meaning not a blocker but something that needs to ship together. When this lands in a beta, expect the pages at [docs.openclaw.ai](https://docs.openclaw.ai) for both the Bedrock and Bedrock Mantle providers to reflect the new install requirement.

## Timeline

PR #81687 is actively under review as of May 14, 2026, targeting the next beta in the `v2026.5.12` series. Given OpenClaw's current cadence of multiple beta releases per week, this is likely to land within days.

If you rely on Bedrock in a production or semi-production setup, now is a good time to audit your provisioning scripts and CI pipelines. Add an explicit provider install step before this reaches a stable release — and any automated OpenClaw deployment running `openclaw update` should plan for it.
