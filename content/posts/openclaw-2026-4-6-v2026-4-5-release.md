---
title: "OpenClaw v2026.4.5: Music Generation, Video Tools, and a Dreaming Memory Overhaul"
excerpt: "OpenClaw v2026.4.5 lands with built-in music and video generation, a fully rebuilt dreaming memory system, multilingual UI, and critical security fixes."
coverImage: '/assets/images/posts/openclaw-2026-4-6-v2026-4-5-release.png'
date: '2026-04-06T08:00:00.000Z'
dateFormatted: April 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-6-v2026-4-5-release.png'
---

OpenClaw v2026.4.5 dropped early this morning — and it is one of the biggest releases in recent memory. This isn't a point update with a handful of polish commits. It's a wave: new built-in media generation tools, a ground-up rebuild of the dreaming memory system, multilingual Control UI, Amazon Bedrock expansions, and a string of important security fixes. Let's dig in.

## Built-in Music and Video Generation

Two new first-class tools arrive in this release: `music_generate` and `video_generate`, available to agents out of the box without extra setup.

`music_generate` ships with bundled Google (Lyria) and MiniMax providers, plus workflow-backed ComfyUI support. There's one practical note: providers like Google Lyria ignore unsupported hints (such as `durationSeconds`) with a warning rather than hard-failing — a sensible decision that keeps agent workflows from breaking on optional parameters.

`video_generate` gets bundled xAI (grok-imagine-video), Alibaba Model Studio Wan, and Runway providers, with live-test and default model wiring for all three. This is a notable expansion: agents can now natively create video through configured providers and return generated media directly in the reply.

Tying both together is a new **bundled ComfyUI media plugin** (`comfy workflow media plugin`) that supports local ComfyUI and Comfy Cloud workflows with shared image, video, and music generation routes — all with prompt injection, optional reference-image upload, and output download.

## Dreaming Memory System: A Full Rebuild

If you use OpenClaw's experimental dreaming feature, v2026.4.5 is a significant update. The system moves from competing modes into **three cooperative phases: light, deep, and REM**, each running on independent schedules with recovery behavior. Combined, they allow durable memory promotion to happen in the background with less manual setup.

Highlights from the dreaming changelog:

- **Weighted short-term recall promotion** and a new `/dreaming` command
- **Dreams UI** with a Dream Diary surface and a lobster animation (yes, really)
- **REM preview tooling** (`openclaw memory rem-harness`, `promote-explain`) to inspect what will be promoted before it happens
- Dreaming trail content now writes to a top-level `dreams.md` file instead of cluttering daily memory notes
- Configurable aging controls (`recencyHalfLifeDays`, `maxAgeDays`) so operators can tune how memory decays over time
- Improved chunking: nearby daily-note lines are grouped into coherent chunks before staging, reducing line-level noise during REM
- Promotion is now **replay-safe**, so re-running reconciles instead of duplicating `MEMORY.md` entries

This is the most mature the dreaming system has been, and it's clearly moving from "experimental curiosity" to a genuine long-term memory engine.

## Multilingual Control UI

The Control UI now ships with localized support for **12 languages**: Simplified Chinese, Traditional Chinese, Brazilian Portuguese, German, Spanish, Japanese, Korean, French, Turkish, Indonesian, Polish, and Ukrainian — contributed by [@vincentkoc](https://github.com/vincentkoc). This is a big step for international accessibility.

## Amazon Bedrock Expansions

Bedrock support gets a substantial upgrade:

- **Mantle support** with bearer token generation from the AWS credential chain, so Bedrock-hosted Claude, GPT-OSS, Qwen, Kimi, GLM, and similar routes work with less manual setup
- **Amazon Bedrock embeddings** for Titan, Cohere, Nova, and TwelveLabs models, with AWS credential-chain auto-detection for `provider: "auto"`
- Inference-profile discovery and automatic request-region injection

## New Providers: Qwen, Fireworks AI, StepFun, and More

The bundled provider catalog grows again with Qwen, Fireworks AI, and StepFun for chat workflows, plus MiniMax TTS, Ollama Web Search, and MiniMax Search integrations. These are now bundled — no manual plugin config needed.

## ClawHub Inside Control UI

Skills get first-class treatment in the interface: the Control UI's Skills panel now includes ClawHub search, detail browsing, and one-click install flows directly in the UI ([#60134](https://github.com/openclaw/openclaw/pull/60134)). No more switching to the CLI to discover and install skills.

## iOS and Matrix Exec Approvals

Exec approvals go native on two more surfaces:

- **iOS**: APNs approval notifications now open an in-app exec approval modal, fetch command details only after authenticated reconnect, and clear stale notification state on resolution
- **Matrix**: Native exec approval prompts with account-scoped approvers, channel-or-DM delivery, and room-thread-aware resolution handling

## Prompt Cache Improvements

A significant focus this release is making prompt caching work more reliably across transport fallback, context compaction, and embedded image history paths. Multiple PRs ([#58036](https://github.com/openclaw/openclaw/pull/58036) through [#60691](https://github.com/openclaw/openclaw/pull/60691)) contribute to this, including:

- Deterministic MCP tool ordering
- Normalized system-prompt fingerprints
- Removal of duplicate in-band tool inventories from agent system prompts
- `openclaw status --verbose` cache diagnostics for inspecting real-time reuse

## Breaking Changes

One breaking change to note: legacy config aliases are removed. Paths like `talk.voiceId`, `talk.apiKey`, `agents.*.sandbox.perSession`, `browser.ssrfPolicy.allowPrivateNetwork`, and several channel allow toggles are deprecated in favor of canonical public paths. Existing configs remain loadable, and `openclaw doctor --fix` can migrate them automatically.

## Security Fixes

The security section is dense. Key items:

- Preserve restrictive plugin-only tool allowlists
- Require owner access for `/allowlist add` and `/allowlist remove`
- Fail closed when `before_tool_call` hooks crash
- Block browser SSRF redirect bypasses earlier
- Restrict QQ Bot local file paths to owned media storage, blocking traversal outside that root

## Where to Get It

Update via your standard method:

```bash
npm install -g openclaw@latest
```

Full changelog and release notes: [github.com/openclaw/openclaw/releases/tag/v2026.4.5](https://github.com/openclaw/openclaw/releases/tag/v2026.4.5)
