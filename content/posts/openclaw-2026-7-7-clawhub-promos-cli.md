---
title: "OpenClaw Adds ClawHub Promo Claims"
excerpt: "OpenClaw now includes a promos CLI for discovering and claiming time-boxed ClawHub model offers without rerunning onboarding."
coverImage: '/assets/images/posts/openclaw-2026-7-7-clawhub-promos-cli.png'
date: '2026-07-07T08:30:00.000Z'
dateFormatted: July 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-7-clawhub-promos-cli.png'
---

OpenClaw merged [PR #100236, "feat(cli): add openclaw promos to discover and claim ClawHub promotional model offers"](https://github.com/openclaw/openclaw/pull/100236), adding a new CLI path for time-boxed ClawHub model promotions.

The feature gives existing users a way to see and claim promotional model offers without rerunning onboarding or hand-editing config. It also introduces passive discovery so live offers can appear where users already inspect models.

## What Changed

OpenClaw now has an `openclaw promos` command group with:

- `openclaw promos list`
- `openclaw promos claim <slug>`

The claim flow can reuse existing provider credentials when the relevant provider plugin is installed, or run the provider's normal auth-choice flow when it is not. Non-interactive use is supported through the same API-key style contract used by onboarding, and setting the suggested model as default remains explicit rather than automatic.

Claimed models are registered through OpenClaw's canonical model config mutators. Aliases follow the existing model-alias contract and do not overwrite existing aliases.

## Passive Discovery

The PR also adds a promotions feed used by `models list`. OpenClaw can fetch ClawHub's hosted promotions snapshot on a 24-hour cadence, cache it in the existing shared SQLite state database, and render live unconfigured offers under an "Available via promotion" group.

That network path is designed to fail silently. It is conditional, cache-backed, and separate from update checks, so promotions discovery should not delay or break normal model listing.

For machine output, the feature stays quiet: `--json` and `--plain` do not include the human-facing promotion notice.

## Safety Model

The PR treats remote promotion payloads as declarative data, not instructions. The body says slugs, model refs, providers, auth choice IDs, and plugin names are contract-validated at the parse boundary. Display text is terminal-sanitized before output.

That matters because a promotions feed is remote and time-sensitive. A malformed or compromised promotion should not be able to execute commands, print terminal controls, or generate unsafe copy-paste instructions.

The claim path also revalidates against the live API, so ClawHub can kill an offer even if a cached feed still mentions it.

## Validation

The PR reports 46 new unit tests across claim, list, feed validation, cache behavior, promotion rendering, and claim provenance. It also reports passing core typechecks, lint, formatting, docs link checks, docs map checks, and a full build.

The author also ran a live end-to-end test against a local ClawHub instance in an isolated state directory: the first `models list` fetched and rendered a live offer, the second used the cadence gate and suppressed the one-time notice, and JSON output stayed clean.

## Bottom Line

OpenClaw is turning ClawHub promotions into a first-class CLI workflow. Users can discover, inspect, and claim offers quickly, while OpenClaw keeps remote promotion data fenced behind validation and explicit user consent.
