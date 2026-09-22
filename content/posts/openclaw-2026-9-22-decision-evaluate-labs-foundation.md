---
title: "OpenClaw Adds Provider-Neutral Decision Evaluate"
excerpt: "OpenClaw PR #155134 adds the shared decision_evaluate tool plus a default-off Labs preference for future Decision assistance."
coverImage: '/assets/images/posts/openclaw-2026-9-22-decision-evaluate-labs-foundation.png'
date: '2026-09-22T23:01:00.000Z'
dateFormatted: September 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-22-decision-evaluate-labs-foundation.png'
---

OpenClaw merged [PR #155134](https://github.com/openclaw/openclaw/pull/155134), a feature PR that gives agents a provider-neutral way to evaluate explicit evidence through their configured Decision model.

The headline is the new core `decision_evaluate` tool. Agents with an effective `decisionModel` can ask Boolean, Choice, or Score questions under normal tool policy and harness capabilities. The tool preserves provider results and provenance, and it returns bounded guidance when input is unsupported or a provider is unavailable.

That phrasing is important: the explicit tool works independently of Labs. Labs receives a new default-off preference called Decision assistance, but enabling that preference does not start automatic inference, grant action authority, or gate the explicit tool.

## What Changed

Before this merge, Decision evaluation work was tied more closely to provider-specific plumbing. PR #155134 removes the TypeSafe-specific evaluation tool registration, tool-specific configuration, and bundled evaluation skill in favor of the shared core tool. TypeSafe still owns its provider transport and credentials, but callers now use shared state and typed questions instead of passing a per-call vendor model override.

Provider capability metadata is also part of the change. `models.list.decisionModels` can expose declared capabilities, and tool guidance can use those declarations. TypeSafe and ONNX declare supported question types, input limits, accounting, and confidence semantics. Undeclared limits stay unknown rather than being treated as unlimited.

The Labs preference is aimed at future automatic consumers. The PR adds `agents.defaults.experimental.decisionAssistance` and an eligibility helper that checks the global opt-in and the owning agent's effective Decision model from prepared config. It does not resolve secrets, probe providers, or run inference.

## Why It Matters

Decision models are useful only if the boundary is legible. An operator should be able to tell the difference between an agent explicitly asking a configured model to evaluate evidence and the system automatically using that model for background assistance.

This PR draws that line. Explicit evaluation is a normal tool, subject to tool policy, agent disablement, cancellation, and provider lifecycle behavior. Automatic Decision assistance remains a separate opt-in foundation with no production consumer connected yet.

It also makes provider constraints visible without turning metadata into a health check. A provider can declare what it supports, but transient readiness should not churn the tool definition or imply that every declared limit is live-probed on every read.

## Evidence Behind the Merge

The PR includes real ONNX proof using GLiClass Edge CPU inference. Boolean, Choice, and Score cases succeeded with Labs off, on, and off again. A state payload larger than one MiB was rejected before provider dispatch, and an empty per-agent model override disabled evaluation without falling back.

Combined-head validation covered 152 focused tests across seven files, core and UI typechecks, relevant formatting, production and full-tree dead-export checks, and regenerated config baselines. Earlier focused coverage included 210 cases for eligibility, schema, registered tool composition, and Labs save/reset behavior.

There are also clear limits. The PR does not claim current-head live TypeSafe or Jev results, and it does not implement the public agent-scoped selection or local-availability inspection API requested in the original proposal.

For users, this is a foundation piece with immediate value: agents get one explicit Decision evaluation surface, and future automatic assistance gets a visible consent boundary before it ever becomes active.
