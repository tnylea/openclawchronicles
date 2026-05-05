---
title: "OpenClaw v2026.4.23: Image Generation Gets a Major Upgrade"
excerpt: "OpenClaw v2026.4.23 delivers Codex OAuth image gen, OpenRouter image support, forked subagent context, and configurable local embedding memory."
coverImage: '/assets/images/posts/openclaw-2026-4-24-release-image-generation.png'
date: '2026-04-24T23:00:00.000Z'
dateFormatted: April 24th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-24-release-image-generation.png'
---

OpenClaw shipped version **v2026.4.23** today, and image generation is the headline act. This release closes long-standing gaps around OpenAI Codex OAuth image creation and OpenRouter image models — two of the most-requested improvements in recent community threads.

## Codex OAuth Image Generation — No API Key Required

The most impactful change: `openai/gpt-image-2` now works through Codex OAuth, which means you no longer need a separate `OPENAI_API_KEY` to generate and edit images from your agents. This fixes [#70703](https://github.com/openclaw/openclaw/issues/70703) and removes a friction point that tripped up a lot of self-hosters.

Alongside that, OpenRouter image generation is now a first-class feature. If you have an `OPENROUTER_API_KEY`, image models available through OpenRouter will work natively with `image_generate` — addressing [#55066](https://github.com/openclaw/openclaw/issues/55066) via [#67668](https://github.com/openclaw/openclaw/pull/67668). Thanks to community contributor [@notamicrodose](https://github.com/notamicrodose) for the implementation.

## Provider-Specific Quality and Format Hints

Agents can now request quality and output format hints when calling image generation tools. For OpenAI specifically, that includes background, moderation, compression level, and a user hint passthrough — all exposed through the `image_generate` tool schema. Credit goes to [@ottodeng](https://github.com/ottodeng) via [#70503](https://github.com/openclaw/openclaw/pull/70503).

This is particularly useful for agents that need fine-grained control over output fidelity, storage size, or compliance-sensitive content moderation settings.

## Forked Context for Subagents

`sessions_spawn` gets a meaningful architecture update: agents can now optionally pass forked context to native child sessions, letting a spawned subagent inherit the requester's transcript when needed. The default behavior remains clean isolated sessions — this is opt-in. The change includes prompt guidance, context-engine hook metadata, updated docs, and QA coverage.

## Per-Call Timeout Control for Generation Tools

A smaller but practical improvement: `image`, `video`, `music`, and TTS generation tools now support optional `timeoutMs` overrides per call. If a specific generation is expected to take longer than the default threshold, agents can extend the timeout just for that invocation instead of raising the global limit.

## Configurable Local Embedding Context Size

Local memory embeddings now support a `memorySearch.local.contextSize` config key, defaulting to 4096 tokens. This matters most on constrained hardware — Raspberry Pi setups and low-RAM VPS hosts can now tune embedding context without patching anything. Fix by [@aalekh-sarvam](https://github.com/aalekh-sarvam) via [#70544](https://github.com/openclaw/openclaw/pull/70544).

## Pi Bundle Updated to 0.70.0

Bundled Pi packages are updated to 0.70.0 in this release. OpenClaw now uses Pi's upstream `gpt-5.5` catalog metadata for OpenAI and Codex, with local forward-compatibility handling for `gpt-5.5-pro` kept minimal.

## Notable Bug Fixes

A few fixes worth calling out from the full changelog:

- **Slack group DMs** now properly suppress "Working…" traces in MPIM rooms — those internal tool-progress markers were leaking into channels ([#70912](https://github.com/openclaw/openclaw/issues/70912))
- **WhatsApp onboarding** no longer fails on packaged QuickStart installs before Baileys runtime dependencies are staged ([#70932](https://github.com/openclaw/openclaw/issues/70932))
- **Block streaming** no longer sends duplicate replies when partial block delivery aborts and the already-sent chunks exactly cover the final reply ([#70921](https://github.com/openclaw/openclaw/issues/70921))
- **Codex on Windows** now resolves `.cmd` npm shims through `PATHEXT` before starting the native app-server ([#70913](https://github.com/openclaw/openclaw/issues/70913))
- **WebChat** now surfaces non-retryable provider errors (billing, auth, rate limits) instead of silently logging them ([#70124](https://github.com/openclaw/openclaw/issues/70124))
- **Memory CLI** can now resolve local embeddings without the gateway running ([#70836](https://github.com/openclaw/openclaw/issues/70836))

## How to Update

```bash
npm install -g openclaw@latest
# or
openclaw update
```

The full changelog is available on the [GitHub Releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.4.23).
