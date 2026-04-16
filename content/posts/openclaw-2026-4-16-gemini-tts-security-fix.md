---
title: "OpenClaw v2026.4.16 Brings Gemini TTS and Security Hardening"
excerpt: "OpenClaw v2026.4.16-beta.1 ships Google Gemini text-to-speech, Claude Opus 4.7 defaults, and a fix blocking tool name injection via client definitions."
coverImage: '/assets/images/posts/openclaw-2026-4-16-gemini-tts-security-fix.png'
date: '2026-04-16T23:00:00.000Z'
dateFormatted: April 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-16-gemini-tts-security-fix.png'
---

OpenClaw's April 16th beta release lands with a notable new channel capability, a model default bump, and a security fix that operators running untrusted environments should pay attention to.

## Gemini Text-to-Speech Is Now Bundled

The headlining addition is Google Gemini TTS support, contributed by [@barronlroth](https://github.com/barronlroth) in [#67515](https://github.com/openclaw/openclaw/pull/67515). The bundled Google plugin now includes a full TTS provider with:

- **WAV reply output** for standard voice responses
- **PCM telephony output** for voice-call integration pipelines
- Voice selection and provider registration
- Full setup docs and guidance

If you're running OpenClaw as a voice assistant or integrating it into telephony workflows, this opens up Gemini's TTS quality as a first-class option alongside existing providers. The PR wires it directly into the bundled Google plugin — no extra package required, just configure your Gemini credentials and select the voice.

## Claude Opus 4.7 Is the New Anthropic Default

Default model selections for Anthropic integrations — including Claude CLI defaults and bundled image understanding — have been updated to Claude Opus 4.7. Opus aliases resolve correctly to the new version. If you have prompt-tuned setups relying on a previous default model behavior, it's worth a test run after updating.

## Gateway Security: Tool Name Collision Prevention

A quieter but meaningful security fix landed in [#67303](https://github.com/openclaw/openclaw/pull/67303). The gateway now:

1. **Anchors MEDIA: passthrough trust** to the exact raw names of registered built-in tools for the current run only
2. **Rejects client tool definitions** whose names normalize-collide with any built-in or with another client-supplied tool in the same request

Both JSON and SSE paths return `400 invalid_request_error` on collision. Previously, a client-supplied tool with a name that normalized to match a built-in could inherit that built-in's local-media trust level. That escape route is now closed.

This matters most in multi-tenant setups or environments where MCP tool definitions arrive from third-party or untrusted sources.

## BlueBubbles and Node 22+ Image Attachments Fixed

Users running BlueBubbles on Node 22+ were hitting broken inbound image attachment downloads. The fix ([#67510](https://github.com/openclaw/openclaw/pull/67510)) strips incompatible bundled-undici dispatchers from the non-SSRF fetch path, adds event-type-aware dedup keys so attachment follow-ups aren't rejected as duplicates, and adds a retry pass against the BB API when the initial webhook arrives with an empty array. Fixes [#64105](https://github.com/openclaw/openclaw/issues/64105), [#61861](https://github.com/openclaw/openclaw/issues/61861), and [#65430](https://github.com/openclaw/openclaw/issues/65430).

## Other Notable Fixes

- **CLI/update** ([#66959](https://github.com/openclaw/openclaw/pull/66959)): Stale packaged dist chunks are pruned after npm upgrades, and downgrade/verify inventory checks are now compat-safe — fixing global upgrades that failed with stale chunk imports.
- **OpenAI Codex models** ([#67635](https://github.com/openclaw/openclaw/pull/67635)): Legacy `openai-codex` rows with missing API metadata or stale `https://chatgpt.com/backend-api/v1` references now self-heal to the canonical Codex transport, stopping requests from routing through broken HTML/Cloudflare paths.
- **Agents/skills**: Available skills entries are now sorted by name after merging sources, so `skills.load.extraDirs` ordering no longer shifts prompt-cache prefixes across restarts ([#64198](https://github.com/openclaw/openclaw/pull/64198)).

## How to Update

```bash
npm install -g openclaw
openclaw --version
```

Full release notes are on the [OpenClaw GitHub releases page](https://github.com/openclaw/openclaw/releases).
