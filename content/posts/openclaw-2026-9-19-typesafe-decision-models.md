---
title: "OpenClaw Adds TypeSafe AI Decision Models"
excerpt: "OpenClaw now bundles TypeSafe AI decision models for typed scores, choices, and boolean probabilities across agent workflows."
coverImage: '/assets/images/posts/openclaw-2026-9-19-typesafe-decision-models.png'
date: '2026-09-19T23:02:00.000Z'
dateFormatted: September 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-19-typesafe-decision-models.png'
---

OpenClaw merged a new bundled decision-model provider in [PR #152298](https://github.com/openclaw/openclaw/pull/152298), adding TypeSafe AI's Jev models as an official opt-in path for quick typed decisions.

The change is not a general chat-model swap. It gives OpenClaw a dedicated model role for choices, scores, and boolean probabilities, with the result surfaced through the existing agent and plugin lifecycle contracts.

## What Changed

The PR bundles TypeSafe AI's Jev models as an optional `decisionModel` provider. Operators can select `typesafe/jev-latest` or `typesafe/jev-1.13.0` globally or per agent, then configure the plugin's API-key SecretRef.

That means a team can keep one model for conversation, another for utility work, and a smaller specialized provider for structured decisions. The role stays disabled until explicitly selected, so existing installs should not suddenly begin sending decision work to a new provider.

The merged work also adds an optional `typesafe_evaluate` tool. Its purpose is narrow: evaluate a supplied state and return TypeSafe's reported scores or probabilities after OpenClaw validates the shape and range of the response.

## Why It Matters

Decision models are a useful fit for workflows where the agent needs a bounded judgment rather than a long-form answer. Examples include choosing between candidate actions, scoring options, gating a policy check, or asking for a probability-like boolean result.

OpenClaw's implementation keeps that role separate from ordinary chat. The PR says provider translation, validation, credentials, and transport stay inside `extensions/typesafe`, while Jev appears in a separate decision-model catalog. Native evaluations use the host-selected model rather than letting individual consumers invent their own routing.

For operators, that separation is the important bit. It makes decision work easier to audit, easier to disable, and easier to assign per agent.

## Safety And Lifecycle

The PR is explicit about boundaries. The adapter uses guarded HTTP helpers against a fixed HTTPS endpoint, with bounded input and output, one deadline covering the whole request, cancellation handling, sanitized errors, and no new vendor SDK dependency.

Credential handling follows OpenClaw's SecretRef path. The provider stays unavailable until the operator supplies credentials, and evaluations use TypeSafe's normal API billing. Provider health and plugin lifecycle state are shared with the host, so a change to one agent's selected model should not retire another agent's in-flight work.

The implementation also keeps provider-reported probabilities and scores intact. OpenClaw validates them structurally, but consumers still own the final policy decision.

## Verification Notes

The PR reports 107 adapter tests, 1,024 synthetic concurrent transport operations with cleanup, live evaluations through an isolated Gateway build, 118 source-selection tests, exact-head CI, and clean independent P0-P2 reviews.

It landed shortly before the nightly cutoff and was followed by [PR #153130](https://github.com/openclaw/openclaw/pull/153130), which reduces repeated state-database copying during provider-driven model catalog and authentication refreshes.

Together, the two changes make the decision-model story feel more production-shaped: a new provider role, plus less background churn when provider catalogs are active.

