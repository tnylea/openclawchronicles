---
title: "OpenClaw Adds Extended-Stable Updates"
excerpt: "OpenClaw now has an extended-stable package update channel for operators who need the trailing supported-month npm release."
coverImage: '/assets/images/posts/openclaw-2026-7-4-extended-stable-updates.png'
date: '2026-07-04T23:03:00.000Z'
dateFormatted: July 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-4-extended-stable-updates.png'
---

OpenClaw merged [PR #99811, "feat(update): support extended-stable package updates"](https://github.com/openclaw/openclaw/pull/99811), adding a new update channel for package-install users who want the trailing supported-month release line.

Until now, OpenClaw had no canonical CLI contract for that lane. The existing `stable` channel already maps to npm `latest`, so operators who needed a slower package track had to work around the updater rather than express that choice directly.

This PR introduces `extended-stable` as a package-only channel across configuration, CLI update commands, status reporting, Gateway handoff, and Package Acceptance.

## What Extended Stable Means

The new channel is designed for npm package installs, not Git checkouts. Package users can run:

```bash
openclaw update --channel extended-stable
```

Once selected, OpenClaw can persist that channel choice, allow bare foreground updates afterward, and show availability through `openclaw update status`.

The PR says the existing `stable`, `beta`, and `dev` defaults and mappings are unchanged. It also says startup and background auto-update are skipped for `extended-stable`, keeping the new lane focused on explicit foreground updates.

## Fail-Closed Resolution

The most important design detail is failure behavior. Foreground updates resolve the public npm selector, verify the selected exact package, reuse existing downgrade and post-core commit boundaries, and reject Git checkouts and tag overrides before mutating anything.

If public npm metadata is missing or inconsistent, the updater does not fall back to another release line. Git users receive a structured non-mutating error.

That matters because update channels are trust boundaries as much as convenience flags. A channel named `extended-stable` only helps if it resolves exactly to that lane or refuses to act.

## Current Publication Caveat

The PR is explicit that the current public-registry prerequisite check returned a 404 for `openclaw@extended-stable` during validation. Positive live-package proof is blocked until the related publication workflow in [PR #99352](https://github.com/openclaw/openclaw/pull/99352) ships the dist-tag.

That means this merge adds the updater machinery and fail-closed behavior first. The public npm lane still needs the matching publication side before operators can rely on a live `extended-stable` dist-tag in production.

## Validation

The PR reports the full CLI update suite passing with 174 tests. It also lists a focused policy matrix covering extended-stable transaction cases, exact-resolution and tag-guard cases, startup/status/channel regressions, Gateway handoff behavior, and Package Acceptance allowlisting for `openclaw@extended-stable`.

Generated config schema, help baselines, base schema generation, formatting, MDX, markdownlint, docs map, and 5,550 internal links also passed.

The live fail-closed proof is the key result. Running the real CLI entrypoint against the current public registry returned a structured `selector_missing` error, a nonzero exit, an empty mutation-step list, and unchanged absent config. A loopback Verdaccio proof then validated successful install and foreground update behavior with a local `extended-stable` dist-tag.

## Bottom Line

OpenClaw is preparing a slower package update lane without changing what `stable` means today. The merge gives operators a named `extended-stable` channel, plus the fail-closed plumbing needed to keep that channel honest once the public dist-tag is published.
