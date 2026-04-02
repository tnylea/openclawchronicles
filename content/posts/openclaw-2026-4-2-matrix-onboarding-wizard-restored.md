---
title: "OpenClaw Restores Matrix Guided Onboarding in the CLI"
excerpt: "A regression broke the Matrix channel setup wizard in OpenClaw CLI flows. PR #59462 restores guided Matrix onboarding and adds end-to-end regression tests."
coverImage: '/assets/images/posts/openclaw-2026-4-2-matrix-onboarding-wizard-restored.png'
date: '2026-04-02T08:05:00.000Z'
dateFormatted: April 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-2-matrix-onboarding-wizard-restored.png'
---

Running `openclaw onboard` and choosing Matrix used to drop you into a friendly interactive setup wizard that walked you through homeserver URL, credentials, and room configuration. Somewhere along the way, a refactor quietly disconnected the Matrix wizard from the shared `setupWizard` seam, and the guided flow stopped working — leaving users to stare at a generic fallback error message instead.

[PR #59462](https://github.com/openclaw/openclaw/pull/59462), merged by [@gumadeiras](https://github.com/gumadeiras) on April 2, 2026, puts the wizard back where it belongs.

## What Broke

OpenClaw's channel-setup registry is responsible for resolving the right onboarding wizard for each channel plugin. The registry only knew how to handle declarative wizard objects — a static shape that describes steps, prompts, and validation rules up front. Matrix's wizard is adapter-shaped: it implements a `configureInteractive` function that drives the conversation dynamically. When the registry encountered an adapter-shaped wizard, it could not resolve it and fell back to an error path.

At the same time, an earlier refactor had also detached the Matrix wizard from `ChannelPlugin.setupWizard` entirely, so even if the registry had handled adapters correctly, Matrix would not have been wired in.

## The Fix

The PR addresses both problems in one coordinated change:

**Registry-level:** The channel-setup registry now accepts both wizard shapes — declarative wizards and adapter-shaped wizards — and resolves them correctly. Declarative wizards are wrapped in an adapter on first use and cached; adapter-shaped wizards are passed through directly.

**Plugin-level:** The Matrix plugin now explicitly re-registers its `matrixSetupWizard` on the `setupWizard` surface of the channel plugin, so the guided flow is available again whenever `setupChannels` is called.

**Type safety:** `ChannelPlugin.setupWizard` is widened to accept `ChannelSetupWizardAdapter` in addition to the existing declarative `ChannelSetupWizard`, and the WhatsApp setup-wizard proxy is narrowed to keep the existing declaration type explicit and unambiguous.

## Test Coverage

The fix ships with regression tests at two levels:

- **Unit tests** verify that the registry correctly handles adapter passthrough and caches the declarative-to-adapter conversion so the same wizard instance is reused on repeated calls.
- **End-to-end tests** exercise the full `setupChannels` flow for Matrix through the CLI, asserting that guided onboarding runs to completion without hitting the fallback error message.

These tests will catch any future disconnection at either the registry or plugin level before it reaches users.

## Who Is Affected

Anyone running `openclaw onboard` and selecting Matrix as a channel will benefit from this fix. The guided wizard is especially useful for first-time Matrix setups where homeserver configuration, room IDs, and bot account credentials all need to be entered correctly. Without the wizard, users were left to configure Matrix manually via `openclaw.json` — doable, but significantly less friendly.

Update to the latest main branch or wait for the next release tag to get the restored onboarding experience.
