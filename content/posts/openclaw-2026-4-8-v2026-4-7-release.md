---
title: "OpenClaw v2026.4.7: Music Generation, Memory Wiki, and a New infer Hub"
excerpt: "OpenClaw v2026.4.7 lands music generation, a restored memory-wiki stack, the openclaw infer CLI hub, Gemma 4, multilingual UI, and dozens of fixes."
coverImage: '/assets/images/posts/openclaw-2026-4-8-v2026-4-7-release.png'
date: '2026-04-08T08:00:00.000Z'
dateFormatted: April 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-8-v2026-4-7-release.png'
---

OpenClaw v2026.4.7 dropped in the early hours of April 8th, and it is one of the biggest releases of the year so far. The changelog spans new media tools, a revived memory subsystem, a major CLI expansion, expanded provider support, multilingual UI, and a wave of reliability fixes. Here is what you need to know.

## openclaw infer — A First-Class Inference Hub

The headline CLI addition is `openclaw infer`, a new top-level command that provides a unified hub for provider-backed inference workflows. Whether you need model completions, image generation, audio transcription, text-to-speech, embeddings, or web search, `openclaw infer` routes the request through your configured providers without requiring a full agent session. Community contributor [@Takhoffman](https://github.com/Takhoffman) drove this addition, which also ships with improved auto-fallback across auth-backed image, music, and video providers — automatically remapping size, resolution, and duration hints to what each provider actually supports.

## music_generate Is Here

OpenClaw agents can now compose music. The new `music_generate` built-in tool ships with bundled support for Google Lyria and MiniMax as providers, plus workflow-backed generation via the new ComfyUI plugin. The tool handles async task tracking and delivers finished audio directly in agent replies. Unsupported optional hints (like `durationSeconds` on Lyria) now produce a warning instead of a hard failure — a welcome improvement for automated workflows.

## Memory Wiki: Restored and Expanded

The `memory-wiki` stack has been fully restored, and it is significantly more capable than before. This release brings back:

- **Plugin, CLI, sync/query/apply tooling** — manage your wiki from the command line or via agent tools
- **Structured claim/evidence fields** — knowledge is now typed, not just text
- **Contradiction clustering and staleness dashboards** — find conflicts and outdated entries automatically
- **Freshness-weighted search** — recent, well-evidenced claims surface first
- **Compiled digest retrieval and claim-health linting** — keep your wiki clean without manual audits

Contributor [@vincentkoc](https://github.com/vincentkoc) drove this restoration. The SDK also gains new `availableTools` and `citationsMode` seams so companion plugins can consume active memory state without reaching into internals.

## Memory Dreaming: Dream Diary and REM Refinements

The dreaming subsystem receives substantial polish in 4.7. The three cooperative phases — light, deep, and REM — now have independent schedules and recovery behavior. New in this release:

- **Dream Diary UI** in the Dreams surface — browse and review what your agent has dreamed
- **Configurable aging controls** (`recencyHalfLifeDays`, `maxAgeDays`) to tune recall decay
- **REM preview tooling** via `openclaw memory rem-harness` and `promote-explain`
- **Dreams.md** — dreaming trail content now writes to a top-level `dreams.md` instead of polluting daily memory notes
- **Session transcript ingestion** into the dreaming corpus with per-day checkpointing

The net result: long-term memory promotion is more reliable, less noisy, and easier to inspect.

## Multilingual Control UI

The Control UI now ships localized in 12 languages: Simplified Chinese, Traditional Chinese, Brazilian Portuguese, German, Spanish, Japanese, Korean, French, Turkish, Indonesian, Polish, and Ukrainian. This is a significant accessibility milestone for OpenClaw's global user base, driven by [@vincentkoc](https://github.com/vincentkoc).

## New Providers and Model Support

- **Gemma 4** — Google's Gemma 4 models are now supported, with correct thinking-off semantics and Gemma reasoning support in compatibility wrappers. ([#61507](https://github.com/openclaw/openclaw/pull/61507), [#62127](https://github.com/openclaw/openclaw/pull/62127))
- **Arcee AI** — A new bundled Arcee AI provider plugin lands with Trinity catalog entries, OpenRouter support, and onboarding guidance. ([#62068](https://github.com/openclaw/openclaw/pull/62068))
- **xAI, Alibaba Wan, Runway** — Three new video generation providers added with live-test and default model wiring.
- **Amazon Bedrock Mantle** — IAM-based bearer token auto-generation from the AWS credential chain, plus Bedrock embeddings for Titan, Cohere, Nova, and TwelveLabs.
- **Qwen, Fireworks AI, StepFun** — Bundled providers, along with MiniMax TTS, Ollama Web Search, and MiniMax Search.
- **Ollama vision** — Vision capability is now auto-detected from `/api/show` so Ollama vision models accept image attachments without manual config. ([#62193](https://github.com/openclaw/openclaw/pull/62193))

## Webhook Ingress Plugin

External automation can now drive OpenClaw TaskFlows via HTTP. The new bundled webhook ingress plugin creates per-route shared-secret endpoints that accept inbound events and push them into bound TaskFlows. ([#61892](https://github.com/openclaw/openclaw/pull/61892))

## Session Compaction Checkpoints

Operators can now inspect and recover pre-compaction session state. The new persisted compaction checkpoints plus Sessions UI branch/restore actions give you a safety net before context gets summarized away. The release also adds a pluggable compaction provider registry so plugins can replace the built-in summarization pipeline entirely. ([#62146](https://github.com/openclaw/openclaw/pull/62146), [#56224](https://github.com/openclaw/openclaw/pull/56224))

## Discord Event Cover Images

Discord agents can now attach cover images when creating events — via URL or local file path. PNG, JPG, and GIF formats are validated and encoded before passing through Discord's API. ([#60883](https://github.com/openclaw/openclaw/pull/60883))

## Prompt Caching Improvements

A cluster of fixes makes prompt prefixes more reusable across turn boundaries: deterministic MCP tool ordering, normalized system-prompt fingerprints, embedded image history alignment, and the removal of duplicate in-band tool inventories from agent system prompts. New `openclaw status --verbose` cache diagnostics help you see whether your runs are actually hitting cache. ([#58036](https://github.com/openclaw/openclaw/pull/58036) and related)

## Security Highlights

The 4.7 release carries multiple security hardening items, including:

- Block model-facing config writes from changing exec approval paths (safeBins, strictInlineEval, etc.) ([#62001](https://github.com/openclaw/openclaw/pull/62001))
- Block dangerous env overrides (Java, Rust, Cargo, Git, Kubernetes, cloud credentials) in host exec ([#59119](https://github.com/openclaw/openclaw/pull/59119))
- Drop request bodies on cross-origin 307/308 redirects to prevent SSRF secret exfiltration ([#62357](https://github.com/openclaw/openclaw/pull/62357))
- Require owner authorization for `/allowlist add` and `/allowlist remove` ([#62383](https://github.com/openclaw/openclaw/pull/62383))
- Block browser SSRF redirect bypasses at the main-frame level ([#62355](https://github.com/openclaw/openclaw/pull/62355))
- Feishu docx uploads now honor `tools.fs.workspaceOnly` to prevent reading outside workspace ([#62369](https://github.com/openclaw/openclaw/pull/62369))

## Upgrading

OpenClaw v2026.4.7 is available now. See the [full release notes on GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.7) for the complete changelog. Note: v2026.4.8 was released the same morning with hotfixes for bundled channel startup — update to that instead if you are on an npm install.
