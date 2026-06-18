---
title: "OpenClaw Adds OpenAI Image CLI Controls"
excerpt: "OpenClaw's image CLI now exposes quality and OpenAI moderation controls for generation and editing workflows."
coverImage: '/assets/images/posts/openclaw-2026-6-18-openai-image-cli-controls.png'
date: '2026-06-18T08:01:00.000Z'
dateFormatted: June 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-18-openai-image-cli-controls.png'
---

OpenClaw's command-line image workflow gained a practical upgrade this morning: the `openclaw infer image` CLI now exposes image quality and OpenAI moderation controls for both generation and editing.

The change landed in [PR #94156](https://github.com/openclaw/openclaw/pull/94156), titled "fix: expose OpenAI image quality and moderation CLI options." It is a small-sounding CLI change with real day-to-day impact for people using OpenClaw as a local media automation surface.

## New CLI Options

The PR adds `--quality low|medium|high|auto` to both:

- `openclaw infer image generate`
- `openclaw infer image edit`

It also adds an OpenAI-specific `--openai-moderation low|auto` flag to both commands.

Those options are not just displayed in help output. The PR says `quality` is passed through as a top-level image generation runtime option, while OpenAI moderation is passed through as `providerOptions.openai.moderation`.

The provider-side gap is important too. The direct OpenAI image path already forwarded moderation, but the Codex Responses image path did not pass it into the upstream `image_generation` tool payload. PR #94156 updates that route so Codex OAuth-backed image requests preserve the same option instead of silently dropping it.

## Why It Matters

OpenClaw already had advanced image controls in the built-in `image_generate` agent tool, but the CLI did not expose all of the same knobs. That left CLI users with an awkward choice: use the agent tool, write custom wrappers, or bypass the CLI for cost-aware and moderation-aware image work.

Quality matters because image generation cost and output expectations vary. A draft image for a test run does not need the same settings as a final asset. Putting `--quality` directly on the CLI makes that distinction scriptable.

Moderation matters because OpenAI image generation has provider-specific behavior. The new `--openai-moderation` flag follows the same provider-specific pattern as the existing `--openai-background` option, keeping OpenAI controls visible without making the generic image command shape messy.

## Example Workflow

For a low-cost draft, the PR gives this generation pattern:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster" \
  --json
```

For editing, the same controls are available:

```bash
openclaw infer image edit \
  --file ./poster.png \
  --model openai/gpt-image-2 \
  --quality high \
  --openai-moderation auto \
  --prompt "Refine this poster for final export" \
  --json
```

That makes the CLI more useful for repeatable pipelines: draft, inspect, regenerate, refine, and export without switching surfaces.

## Tested Coverage

The PR reports focused CLI and provider tests. Its verification section says the capability CLI test suite passed 97 tests, the OpenAI image generation provider test suite passed 62 tests, docs formatting was clean, `pnpm build` succeeded, and `git diff --check` found no whitespace errors.

The behavior proof covers the essentials: generation and edit commands accept the new flags, invalid values fail early, capability inspect metadata reports the expanded flags, and the Codex Responses image route sends moderation inside the `image_generation` tool payload.

The takeaway: OpenClaw's image CLI is now closer to a complete automation interface, not just a thin prompt wrapper.

Source: [OpenClaw PR #94156](https://github.com/openclaw/openclaw/pull/94156).
