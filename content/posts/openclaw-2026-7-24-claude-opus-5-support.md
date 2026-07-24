---
title: "OpenClaw Adds Claude Opus 5 Support"
excerpt: "OpenClaw now supports Claude Opus 5 across Anthropic, Claude CLI, Bedrock, Vertex, and Mantle provider routes."
coverImage: '/assets/images/posts/openclaw-2026-7-24-claude-opus-5-support.png'
date: '2026-07-24T23:02:00.000Z'
dateFormatted: July 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-24-claude-opus-5-support.png'
---

OpenClaw merged [PR #113391](https://github.com/openclaw/openclaw/pull/113391), wiring Claude Opus 5 into the platform's Anthropic-family model catalogs and request-shaping contracts.

This is a feature update, but it also fixes a sharp compatibility edge. Before the change, a hand-configured `anthropic/claude-opus-5` route could be treated like an older Claude model. That meant OpenClaw could shape requests with parameters Opus 5 rejects, including the wrong thinking payload and non-default sampling controls.

The result was a model that looked configurable but could fail at runtime with provider-side 400 errors. The merged PR closes that gap by teaching OpenClaw what Opus 5 actually expects.

## Provider Coverage

The change adds Opus 5 support across the major Claude routes OpenClaw users are likely to touch:

- Anthropic API
- Claude CLI
- Amazon Bedrock
- Anthropic Vertex
- Mantle request shaping

The catalogs now include the model metadata OpenClaw needs for picking, routing, context accounting, and request defaults. The PR records a 1M context default, 128k output metadata, pricing rows, image limits, aliases, and effort mappings including `xhigh` and `max`.

Opus 5 is also seeded into the default Claude CLI allowlist, so setup and doctor migrations can add the route for existing CLI users.

## Request Shaping

The most important part of this merge is not merely listing a new model. OpenClaw has to shape model requests according to each provider's contract.

For Opus 5, the PR adds identity resolution and thinking-profile logic matching the model's adaptive-thinking behavior. It also joins Opus 5 to the same no-prefill request handling used by the latest Sonnet family, strips sampling parameters when required, and updates streaming refusal handling for the model's safety-classifier path.

Those details are easy to miss in a model-picker screenshot, but they are what make a new model feel boring in production. Operators should not have to discover that a model works only when a particular temperature, prefill, effort, or token budget combination is avoided.

## What Did Not Change

The PR deliberately avoids a few default flips. The bare `opus` family alias still resolves to Claude Opus 4.8, and the Claude CLI default model remains Claude Opus 4.8. Fast mode also stays on the existing Opus 4.8 and 4.7 paths.

That restraint is useful. Adding a new high-end model is different from silently moving existing users onto it. OpenClaw gets explicit support for users who choose Opus 5 while preserving current defaults for users who do not.

## Validation

The validation section is broad. OpenClaw reports focused local coverage across plugin SDK provider sharing, Anthropic extensions, Bedrock, Vertex, Mantle, LLM core, agent core, model catalog core, AI provider and transport tests, agent context tests, and wizard suites.

New regression coverage checks the Opus 5 predicates and profile, manifest contracts, CLI catalog metadata, context-window rows, and boundary behavior so `claude-opus-50` does not accidentally match Opus 5.

For users waiting to try Claude Opus 5 inside OpenClaw, this is the key platform merge: the model is now represented in catalogs and routed through request contracts that match its actual behavior.
