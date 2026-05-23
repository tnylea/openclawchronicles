---
title: "OpenClaw v2026.5.22: Model Listing Gets 4,100x Faster"
excerpt: "OpenClaw v2026.5.22 beta ships a 4,100x speedup for /models calls, smarter subagent context limits, and a session picker with search. Here's what changed."
coverImage: '/assets/images/posts/openclaw-2026-5-23-v2026522-model-speedup.png'
date: '2026-05-23T23:00:00.000Z'
dateFormatted: May 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-23-v2026522-model-speedup.png'
---

OpenClaw's latest pre-release, **v2026.5.22-beta.1**, landed today with a headline change that's hard to overstate: model listing just got **4,100 times faster**. That's not a typo.

## The Big One: /models in 5ms Instead of 20 Seconds

Prior to this release, every call to `/models` — and every other model-listing operation — triggered a full per-provider plugin and external CLI discovery pass on the hot path. The result was a ~20-second wait that users felt every time they loaded a model picker or ran a fresh session.

PR [#84816](https://github.com/openclaw/openclaw/pull/84816) by contributor **@sjf** fixes this elegantly: the provider auth-state map is now **pre-warmed at gateway startup**, and all subsequent `/models` calls short-circuit to the cached result. The one-time warm-up cost happens once at boot, and the map resets and re-warms automatically after hot reloads.

The result: a 20-second call becomes a **5ms** response — a 4,100× improvement. If you've ever wondered why OpenClaw felt sluggish when switching models, this is the fix you've been waiting for.

## Smarter Subagents: Less Context, Less Leakage

A quieter but meaningful change lands in [#85283](https://github.com/openclaw/openclaw/pull/85283): **default sub-agent bootstrap context is now limited to `AGENTS.md` and `TOOLS.md`**. Previously, delegated workers inherited the full workspace context — persona (`SOUL.md`), identity (`IDENTITY.md`), user profile (`USER.md`), memory files, heartbeat state, and setup files.

This matters for two reasons. First, it reduces token spend for subagent runs that don't need personal context. Second, and more importantly, it prevents sensitive personal context from leaking into delegated workers that handle code, web fetch, or other tool-heavy tasks.

Per-agent override is available if you do need full context in a specific agent.

## Session Picker Gets Search and Pagination

The Control UI's chat session picker has been improved in [#85237](https://github.com/openclaw/openclaw/pull/85237): sessions now load with a bounded initial count, with **search** and a **Load More** button to reach older conversations. Power users with hundreds of sessions will appreciate not waiting for a full list load on every page visit.

## Cleaner Onboarding for New Installs

Running `openclaw` bare — before any config exists — now **starts classic onboarding** automatically ([#72343](https://github.com/openclaw/openclaw/pull/72343)). Configured installs continue to use Crestodian as before. This smooths the first-run experience for newcomers who aren't sure where to start.

## xAI/Grok: Device-Code OAuth and Alias Support

Remote and headless OpenClaw setups can now authorize xAI **without needing a localhost browser callback**, using device-code OAuth ([#84005](https://github.com/openclaw/openclaw/pull/84005)). xAI OAuth auth profiles are also reused for Grok `web_search`, new Grok model aliases are added, and media providers can now declare default operation timeouts.

## Plugin SDK: Embedding Providers and Session Helpers

Two new Plugin SDK capabilities arrive in this release:

- **Row-level session workflow helpers** ([#84693](https://github.com/openclaw/openclaw/pull/84693)) let plugins read and patch sessions without depending on the legacy whole-store shape. `loadSessionStore` is now deprecated.
- A new **embeddingProviders capability contract** makes embeddings a first-class reusable provider surface, decoupled from memory-specific adapters.

## Smaller npm Package

The npm tarball now excludes documentation images and assets ([thanks @SebTardif](https://github.com/SebTardif)), trimming published package size without affecting runtime behavior. The `protobufjs` dependency has also been updated to **8.4.0** to clear a current npm advisory.

## Notable Fixes

Several sharp edges are addressed in this release:

- **Parallel tool-call delta corruption** — interleaved OpenAI-compatible tool-call deltas were being written into the same argument buffer. Fixed in [#82263](https://github.com/openclaw/openclaw/pull/82263).
- **TUI agent visibility** — message-tool-only agents were invisible in `openclaw tui`. Fixed, closes [#85538](https://github.com/openclaw/openclaw/issues/85538).
- **Transcript archive failures** — session rotation errors were silently swallowing stranded transcript files. Now surfaced properly, closes [#81984](https://github.com/openclaw/openclaw/issues/81984).
- **Debug proxy tunnel leak** — abrupt client disconnects were leaking tunnel resources. Fixed in [#82444](https://github.com/openclaw/openclaw/pull/82444).
- **Diff viewer blanking** — a single broken diff card could blank the entire viewer. Now each card hydrates independently ([#84775](https://github.com/openclaw/openclaw/pull/84775)).

## Install and Upgrade

v2026.5.22-beta.1 is available now on GitHub Releases. As a pre-release, it's tagged for early adopters. A stable build typically follows within a few days.

```bash
npm install -g openclaw@latest
```

Or follow the [GitHub release page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.22-beta.1) for full changelog details.
