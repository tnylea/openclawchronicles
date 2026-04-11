---
title: "OpenClaw v2026.4.10: Active Memory, Codex Provider, and More"
excerpt: "OpenClaw v2026.4.10 lands with a built-in Active Memory plugin, a bundled Codex provider, local MLX speech, and sweeping security hardening across browser, exec, and tools."
coverImage: '/assets/images/posts/openclaw-2026-4-11-release-v20264-10.png'
date: '2026-04-11T08:00:00.000Z'
dateFormatted: April 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-11-release-v20264-10.png'
---

OpenClaw v2026.4.10 shipped overnight on April 11, 2026, and it is one of the bigger releases of the year. The changelog spans a new opt-in memory system, a first-class Codex provider, local speech synthesis for macOS, expanded platform coverage, and what may be the most thorough security hardening wave the project has shipped in a single release.

Here is what you need to know.

## Active Memory: Proactive Recall Before Every Reply

The headline feature is **Active Memory** — a new optional plugin that runs a dedicated blocking memory sub-agent immediately before the main assistant reply. The motivation is straightforward: most memory systems are reactive. They wait for the user to say "remember this" or for the agent to decide to search. Active Memory acts first.

When enabled, it queries your memory store on every eligible conversation turn and injects a compact hidden context block into the main reply. If nothing relevant is found, it returns `NONE` and adds no overhead to the response.

You can enable it with a single config block:

```json
{
  "plugins": {
    "entries": {
      "active-memory": {
        "enabled": true,
        "config": {
          "agents": ["main"],
          "queryMode": "recent",
          "promptStyle": "balanced",
          "timeoutMs": 15000,
          "maxSummaryChars": 220
        }
      }
    }
  }
}
```

The plugin supports three query modes (`message`, `recent`, `full`) and six prompt styles (`balanced`, `strict`, `contextual`, `recall-heavy`, `precision-heavy`, `preference-only`). Use `/verbose on` to watch it work in real time. Full docs are at [docs.openclaw.ai/concepts/active-memory](https://docs.openclaw.ai/concepts/active-memory).

## Codex Provider: Native Threads, Managed Auth, and Compaction

OpenClaw now ships a **bundled Codex provider** that routes `codex/gpt-*` model references through Codex-managed auth, native threads, model discovery, and compaction. This is separate from the existing `openai/gpt-*` path, which continues to use the standard OpenAI provider. The split means you can use Codex's managed account experience without any config overlap with your existing OpenAI setup.

The release also adds strict agentic contract support for GPT-5-family runs, an opt-in that keeps plan-only or filler turns acting until they hit a real blocker. OpenAI/Codex tool schema compatibility is baked in, with embedded-run replay and liveness state for long-running operations.

## Local MLX Speech for macOS Talk Mode

macOS users on Apple Silicon get an experimental local speech provider for Talk Mode via **MLX**. The addition includes explicit provider selection, local utterance playback, interruption handling, and a fallback to system voices when the local model is unavailable. This is the first time OpenClaw ships a fully on-device TTS path on macOS, with no cloud dependency.

## Microsoft Teams and Platform Fixes

Teams users receive a meaningful update: **message actions for pin, unpin, read, react, and listing reactions** land via [#53432](https://github.com/openclaw/openclaw/pull/53432). On top of that, a broad fix sweep restores media downloads for personal DMs, OneDrive/SharePoint shared files, Bot Framework conversations, and Graph-backed chat IDs. SSO sign-in callbacks, typing indicators for long tool chains, and cron announcement delivery to Teams conversation IDs are all included.

WhatsApp reconnect stability improves significantly — inbound replies, media, and composing indicators now stay attached to the current socket across reconnect gaps.

## QA Infrastructure Expansion

The QA matrix grows in this release with:

- A **live Matrix QA lane** backed by a disposable homeserver, covering threading, reactions, restart, and allowlist behavior
- A **live Telegram QA lane** for private-group bot-to-bot verification
- A **Multipass VM lane** for repo-backed QA scenarios running inside a disposable Linux VM

These additions signal that the project is investing heavily in cross-platform integration confidence before major feature work lands.

## Seedance 2.0 Video Generation

The bundled `fal` provider now references **Seedance 2.0** model IDs and submits the provider-specific duration, resolution, audio, and seed metadata fields required for live Seedance 2.0 runs. No separate config needed beyond selecting the model.

## Gateway Improvements

The Gateway also picks up a useful new RPC: **`commands.list`**, which lets remote clients discover runtime-native, text, skill, and plugin commands with surface-aware naming and serialized argument metadata ([#62656](https://github.com/openclaw/openclaw/pull/62656)).

Gateway startup is also more resilient — Tailscale exposure and the update check now start before waiting on channel and plugin sidecar startup, preventing remote operator lockouts when a sidecar stalls. WebSocket RPC stays available during startup, and the pre-auth WebSocket upgrade budget is enforced before the no-handler 503 path.

## Upgrade

```bash
openclaw update
openclaw gateway restart
```

Full release notes are on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.10).
