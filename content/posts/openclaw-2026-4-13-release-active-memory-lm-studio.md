---
title: "OpenClaw 2026.4.12: Active Memory, LM Studio, and MLX Talk"
excerpt: "OpenClaw 2026.4.12 ships a dedicated Active Memory sub-agent, native LM Studio support, MLX local speech for macOS, and three security patches."
coverImage: '/assets/images/posts/openclaw-2026-4-13-release-active-memory-lm-studio.png'
date: '2026-04-13T12:35:00.000Z'
dateFormatted: April 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-13-release-active-memory-lm-studio.png'
---

OpenClaw's April quality push landed today. The **2026.4.12** release — tagged April 13 at 12:35 UTC — is a broad "make everything more reliable" drop covering memory, local models, speech, plugin loading, and three security hardening patches. Here's what's new.

## Active Memory: Automatic Recall Before Every Reply

The headline feature is **Active Memory** ([#63286](https://github.com/openclaw/openclaw/pull/63286)), contributed by [@Takhoffman](https://github.com/Takhoffman). Rather than requiring users to remember to say "search memory" or "remember this," OpenClaw now optionally runs a dedicated memory sub-agent right before the main reply — automatically pulling in relevant preferences, past context, and details from your memory store.

Three configurable context modes ship with it:

- **message** — recall only against the current message
- **recent** — recall against recent conversation context
- **full** — full context window recall

You can tune the recall sub-agent's prompt and thinking level independently from your main agent, inspect what it retrieved with `/verbose`, and opt-in to transcript persistence for debugging. A follow-up PR ([#65068](https://github.com/openclaw/openclaw/pull/65068)) defaults QMD recall to search mode so recall works predictably without extra configuration.

This is one of the most-requested UX improvements in OpenClaw's memory layer — the difference between memory that works and memory that requires babysitting.

## LM Studio Gets a Native Provider

[@rugvedS07](https://github.com/rugvedS07) contributed a full **LM Studio provider** ([#53248](https://github.com/openclaw/openclaw/pull/53248)) — not a generic OpenAI-compatible shim, but a proper bundled provider with:

- Guided onboarding flow
- Runtime model discovery (no manual model IDs)
- Stream preload support for faster first tokens
- Memory-search embeddings for local recall

If you've been running LM Studio alongside OpenClaw with a manual `openai-compatible` config, this is worth migrating to. The runtime model discovery alone eliminates a common friction point when switching local models.

## MLX Speech for macOS Talk Mode

[@ImLukeF](https://github.com/ImLukeF) added an **experimental MLX speech provider** for Talk Mode on macOS ([#63539](https://github.com/openclaw/openclaw/pull/63539)). This runs speech synthesis entirely locally using Apple Silicon's MLX framework, with:

- Explicit provider selection (`mlx` vs system voice vs cloud)
- Local utterance playback and interruption handling
- System-voice fallback when MLX isn't available

On Apple Silicon, this should be noticeably faster than cloud TTS for interactive voice sessions — and it's fully offline.

## Codex Bundled Provider

[@steipete](https://github.com/steipete) contributed the **Codex bundled provider and plugin-owned app-server harness** ([#64298](https://github.com/openclaw/openclaw/pull/64298)). The key distinction: `codex/gpt-*` models now use Codex-managed auth and native threads, while `openai/gpt-*` continues through the standard OpenAI provider path. They're no longer the same pipe.

## Plugin Loading Overhaul

A significant cleanup from [@vincentkoc](https://github.com/vincentkoc) across five PRs ([#65120](https://github.com/openclaw/openclaw/pull/65120), [#65259](https://github.com/openclaw/openclaw/pull/65259), [#65298](https://github.com/openclaw/openclaw/pull/65298), [#65429](https://github.com/openclaw/openclaw/pull/65429), [#65459](https://github.com/openclaw/openclaw/pull/65459)) narrows CLI, provider, and channel activation to only what each plugin's manifest declares it needs. The result: leaner startup, faster command discovery, and no more loading unrelated plugin runtimes at startup.

## Gateway: Command Discovery RPC

[@samzong](https://github.com/samzong) added a `commands.list` RPC to the gateway ([#62656](https://github.com/openclaw/openclaw/pull/62656)) — remote clients can now discover runtime-native commands, skill aliases, and plugin commands with their argument metadata. This is the foundation for better gateway-connected Control UI command palettes and external tooling.

## Other Notable Changes

- **Matrix streaming**: MSC4357 live markers for typewriter animation in supporting Matrix clients ([#63513](https://github.com/openclaw/openclaw/pull/63513))
- **Per-provider private network**: `models.providers.*.request.allowPrivateNetwork` for trusted self-hosted endpoints ([#63671](https://github.com/openclaw/openclaw/pull/63671))
- **QA/Multipass**: run QA suites inside a disposable Linux VM ([#63426](https://github.com/openclaw/openclaw/pull/63426))
- **Dreaming reliability**: fixed double-ingestion of dream transcripts, heartbeat event deduplication, and narrative cleanup hardening
- **Memory/wiki Unicode**: non-ASCII titles no longer collapse or overflow path limits ([#64742](https://github.com/openclaw/openclaw/pull/64742))

## Security Patches

Three security patches ship in this release, all from [@pgondhi987](https://github.com/pgondhi987):

- **busybox/toybox removed from safe exec bins** ([#65713](https://github.com/openclaw/openclaw/pull/65713)) — busybox was functioning as an interpreter bypass; it's now blocked
- **Empty approver list no longer grants approval** ([#65714](https://github.com/openclaw/openclaw/pull/65714)) — a misconfigured empty approver list previously granted implicit authorization
- **Shell-wrapper injection blocked** ([#65717](https://github.com/openclaw/openclaw/pull/65717)) — broader shell-wrapper detection and env-argv assignment injection prevention

All three are in the hardening category — updating is recommended for any instance that processes untrusted input or runs in a multi-user environment.

## Upgrading

```bash
openclaw update
```

Full changelog and release notes: [github.com/openclaw/openclaw/releases](https://github.com/openclaw/openclaw/releases)
