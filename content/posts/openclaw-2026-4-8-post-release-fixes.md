---
title: "OpenClaw Post-Release: Matrix DM Fix, Browser Hardening, and Memory Grounding"
excerpt: "A wave of post-release PRs lands on OpenClaw main — fixing Matrix DM policy migration, browser navigation guards, and memory grounded backfill promotion."
coverImage: '/assets/images/posts/openclaw-2026-4-8-post-release-fixes.png'
date: '2026-04-08T23:00:00.000Z'
dateFormatted: April 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-8-post-release-fixes.png'
---

The OpenClaw team shipped v2026.4.7 and v2026.4.8 this morning, but the day did not stop there. By the time 11 PM UTC rolled around, several more pull requests had merged into `main` — targeting the Matrix channel, the browser control tool, the memory dreaming subsystem, and internal test infrastructure. Here is what landed tonight.

## Matrix: Legacy DM Policy Migration Fixed

One of the more impactful fixes tonight addresses a quiet breakage that affected Matrix users who had the legacy `trusted` DM policy set. PR [#62942](https://github.com/openclaw/openclaw/pull/62942) by contributor [@lukeboyett](https://github.com/lukeboyett) fixes how `channels.matrix.dm.policy 'trusted'` is migrated to the new policy schema.

The bug: the migration logic was counting raw string length when deciding between `allowlist` and `pairing` as the target policy. An `allowFrom` list containing whitespace-only entries (e.g., `[' ']`) would evaluate as non-empty, migrate to `allowlist`, and then silently block all DMs — because downstream normalization trims those entries to nothing. The fix trims entries before the length check, so whitespace-only lists correctly fall through to the safer `pairing` default.

As the PR notes, `pairing` is a strict superset of `allowlist` for accepting already-trusted senders: it consults both the pairing store and the explicit `allowFrom` list. The only difference is how unknown senders are handled — `pairing` prompts a pairing request, while `allowlist` silently drops. This makes `pairing` the correct safe fallback.

**If you are on Matrix with a `trusted` DM policy and upgraded to 4.7 or 4.8, update again once this lands in a release to ensure your DM policy migrates correctly.**

## Browser Control: Interaction-Driven Navigation Guards

PR [#63226](https://github.com/openclaw/openclaw/pull/63226) by [@eleqtrizit](https://github.com/eleqtrizit) and [@drobison00](https://github.com/drobison00) hardens the browser control tool's handling of interaction-driven navigations.

The browser automation layer now re-checks navigations triggered by user interactions — click events, form submissions, and similar — before deciding how to respond. This prevents a class of edge cases where interaction-triggered redirects bypassed the browser's navigation guards. The fix adds:

- **Interaction navigation re-checks** on delayed triggers
- **Unchanged interaction URL short-circuit** — avoids re-processing navigations that didn't actually change the URL
- **Delayed interaction navigation guards** for async redirect flows

This is a robustness improvement for agents that automate web interactions. Sites that issue redirects after form submissions or button clicks should behave more predictably now.

## Memory Dreaming: Grounded Backfill into Short-Term Promotion

PR [#63370](https://github.com/openclaw/openclaw/pull/63370) from [@mbelinky](https://github.com/mbelinky) feeds grounded memory backfill candidates into the short-term promotion pipeline, alongside a related PR [#63395](https://github.com/openclaw/openclaw/pull/63395) that surfaces the grounded scene lane in the dreaming UI.

The memory dreaming system tracks how many times a memory entry has been "grounded" — confirmed by subsequent sessions — as a signal for long-term promotion. Previously, backfill candidates (entries retroactively grounded by new context) were not fed into the short-term promotion pass, meaning some well-evidenced memories could stall in the pipeline. This fix closes that gap.

On the UI side, the dreaming trace now shows a dedicated grounded lane, surfacing entry metrics like grounded count, recall count, and daily count so operators can inspect which memories are being promoted via the grounded path vs. recall or daily paths.

This builds on the memory-wiki and dreaming improvements from v2026.4.7 — the team is clearly investing heavily in making long-term memory reliable and inspectable.

## ACP Block Text in Slack Output Visibility

PR [#62858](https://github.com/openclaw/openclaw/pull/62858) by [@gumadeiras](https://github.com/gumadeiras) updates the Slack channel plugin's outbound visibility contract so that ACP "block" text is treated as user-visible delivered output. Before this fix, ACP block payloads were not counted as visible output, which could cause the agent to generate redundant follow-up replies when the block message had already been delivered. A clean, low-surface fix for a common annoyance in ACP-heavy Slack deployments.

## Test Infrastructure: Contract Barrel Cleanup

PR [#63311](https://github.com/openclaw/openclaw/pull/63311) by [@altaywtf](https://github.com/altaywtf) prevents test-only helpers from leaking into bundled plugin production contract barrels. The PR moves Slack and iMessage test-helper exports to `test-api` surfaces (instead of `contract-api`) and adds a guardrail test to enforce the separation going forward.

This is internal hygiene, but it matters for plugin authors: if you build plugins that import from OpenClaw's contract barrels, you will no longer risk accidentally pulling in `vitest` or other test dependencies in your production build.

## What to Expect Next

None of these PRs have landed in a numbered release yet — they are queued on `main`. Based on the pace of releases today (two in one morning), it is reasonable to expect a patch release incorporating these fixes in the next day or two. Watch the [GitHub releases page](https://github.com/openclaw/openclaw/releases) for the drop.
