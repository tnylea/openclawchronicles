---
title: "OpenClaw Adds One-Click Local Model Setup"
excerpt: "OpenClaw web and macOS onboarding now expose local model download actions with streaming progress for Ollama and llama.cpp guided first-run setup flows."
coverImage: '/assets/images/posts/openclaw-2026-7-25-local-model-setup.png'
date: '2026-07-25T08:04:00.000Z'
dateFormatted: July 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-25-local-model-setup.png'
---

OpenClaw merged [PR #113476](https://github.com/openclaw/openclaw/pull/113476), adding local model download actions to the web setup flow and macOS onboarding.

The short version: when OpenClaw recommends a local model path, users no longer have to drop into the CLI just to pull or download the model. The setup UI can now start the existing Gateway prepare transport and show live progress.

That is a small product change with a big onboarding effect. Local model support is only friendly when the first-run experience handles the boring setup steps.

## What Changed

The PR adds a data-driven "set up local model" affordance for the two Gateway-supported prepare choices:

- Ollama
- llama.cpp

On the web, the model setup page starts `openclaw.setup.prepare.start` and drives the existing wizard progress sheet. On macOS, onboarding reuses the provider auth sheet flow, so the native app can guide users through the same prepare work without inventing a separate progress surface.

The action is gated on admin scope and method advertisement. Older Gateways do not show the affordance, and the UI suppresses it when a usable detected candidate already covers the provider.

## Why It Matters

OpenClaw already had the streaming prepare transport from earlier work, but users still needed a visible entry point. That meant web and macOS users could see local-model recommendations yet still have to know which CLI command to run.

This merge connects the transport to the onboarding surfaces people actually use. A user starting from nothing configured can move from recommendation to model download or pull with one action and visible progress.

The flow is careful about what completion means. Prepare completion re-detects available candidates, but it does not assert that model setup is complete or silently set the default model. That keeps the setup step honest: downloading a model is not the same as choosing it as the active default.

## User Impact

For new local-first OpenClaw setups, this should reduce one of the most common points of friction. A user can stay in the web or macOS onboarding flow while OpenClaw prepares Ollama or llama.cpp-backed choices.

For operators managing mixed environments, the method-advertisement gate matters too. The UI only presents prepare actions that the connected Gateway knows how to execute, so older or differently configured Gateways avoid dead buttons.

## Validation

OpenClaw reports 44 passing web tests across six files, covering the button-to-prepare method path, wizard runner parameterization, and prepare-option suppression. The macOS debug build passed, with 85 `OnboardingAISetupTests` green.

The PR also passed `ui:i18n:verify`, SwiftFormat, SwiftLint, and autoreview. The known limitation is explicit: preparable choice IDs mirror the Gateway prepare method's current accepted-choice contract on the client side, with a future wire-level capability flag suggested if more preparable providers arrive.

For now, the practical win is clear. Local model setup in OpenClaw is moving out of the command-line-only lane and into the guided onboarding path.
