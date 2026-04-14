---
title: "OpenClaw 2026.4.14: GPT-5.4 Pro, ReDoS Fix, and Security Hardening"
excerpt: "OpenClaw 2026.4.14 ships GPT-5.4 Pro compatibility, a Control UI ReDoS fix, stronger security hardening, and a flood of Ollama and memory fixes."
coverImage: '/assets/images/posts/openclaw-2026-4-14-release.png'
date: '2026-04-14T23:00:00.000Z'
dateFormatted: April 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-14-release.png'
---

OpenClaw [2026.4.14](https://github.com/openclaw/openclaw/releases/tag/v2026.4.14) dropped this afternoon — the team describes it as a "broad quality release focused on model provider improvements for the GPT-5 family and channel provider issues," with an emphasis on overall performance through core codebase refactors. There is a lot to unpack.

## GPT-5.4 Pro Is Now First-Class

The headline new feature is forward-compatibility support for **gpt-5.4-pro** across the OpenAI Codex provider, including correct pricing and limits visibility before the upstream catalog catches up ([#66453](https://github.com/openclaw/openclaw/pull/66453)). The release also maps OpenClaw's minimal thinking mode to OpenAI's supported `low` reasoning effort for GPT-5.4 requests, and canonicalizes the legacy `openai-codex/gpt-5.4-codex` runtime alias to `openai-codex/gpt-5.4` while still honoring per-model overrides.

If you have been using Codex models, there is also a fix that ensures the `apiKey` is included in the Codex provider catalog output, preventing the Pi ModelRegistry from rejecting the entry and silently dropping all custom models from every provider in `models.json` ([#66180](https://github.com/openclaw/openclaw/pull/66180)).

## Control UI ReDoS Fix

A notable security fix in this release replaces **marked.js** with **markdown-it** in the Control UI ([#46707](https://github.com/openclaw/openclaw/pull/46707)). The old parser was vulnerable to ReDoS — a regex denial-of-service attack where maliciously crafted markdown could freeze the UI indefinitely. If you run the web interface and interact with untrusted content, upgrade as soon as possible.

## Security Hardening Across the Stack

This release includes several important security fixes merged from the recent AI-assisted security audit:

- **Slack/interactions**: The configured `allowFrom` owner allowlist now correctly applies to channel block-action and modal interactive events, closing a bypass where interactive triggers could skip the allowlist in channels without a users list ([#66028](https://github.com/openclaw/openclaw/pull/66028)).
- **Media/attachments**: OpenClaw now fails closed when a local attachment path cannot be canonically resolved via `realpath`, preventing a path-traversal downgrade attack ([#66022](https://github.com/openclaw/openclaw/pull/66022)).
- **Gateway tool**: The model-facing gateway tool now rejects `config.patch` and `config.apply` calls that would enable dangerous flags enumerated by the OpenClaw security audit — for example `dangerouslyDisableDeviceAuth` or `allowInsecureAuth` — while still allowing non-dangerous edits in the same patch ([#62006](https://github.com/openclaw/openclaw/pull/62006)).
- **Heartbeat**: Owner downgrade is now forced for untrusted `hook:wake` system events ([#66031](https://github.com/openclaw/openclaw/pull/66031)).
- **Browser/SSRF**: SSRF policy is now enforced on snapshot, screenshot, and tab routes ([#66040](https://github.com/openclaw/openclaw/pull/66040)).
- **Microsoft Teams**: Sender allowlist checks are now enforced on SSO signin invokes ([#66033](https://github.com/openclaw/openclaw/pull/66033)).

## Ollama Gets Better Timeout and Usage Handling

Two Ollama fixes stand out. First, the configured `agents.defaults.timeoutSeconds` override is now properly forwarded into the global undici stream timeout, so slow local Ollama runs no longer inherit the default stream cutoff ([#63175](https://github.com/openclaw/openclaw/issues/63175)). Second, `stream_options.include_usage` is now sent for Ollama streaming completions, meaning local Ollama runs finally report real usage numbers instead of bogus prompt-token counts that were triggering premature context compaction ([#64568](https://github.com/openclaw/openclaw/pull/64568)).

## Memory and Embedding Provider Fixes

Non-OpenAI provider prefixes are now preserved when normalizing OpenAI-compatible embedding model refs, fixing a bug where proxy-backed memory providers would fail with `Unknown memory embedding provider` ([#66452](https://github.com/openclaw/openclaw/pull/66452)). Google image generation also gets a fix: a trailing `/openai` suffix is now stripped from configured Google base URLs only when calling the native Gemini image API, so Gemini image requests stop 404-ing without breaking explicit OpenAI-compatible endpoints ([#66445](https://github.com/openclaw/openclaw/pull/66445)).

## Telegram Forum Topics

Telegram operators will appreciate that human topic names are now surfaced in agent context, prompt metadata, and plugin hook metadata by learning them from forum service messages ([#65973](https://github.com/openclaw/openclaw/pull/65973)), and those learned names are now persisted to the session sidecar store so they survive restarts ([#66107](https://github.com/openclaw/openclaw/pull/66107)).

## How to Update

```bash
openclaw update
openclaw gateway restart
```

The full changelog is on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.14). As always, check `openclaw doctor` after updating if you run any custom provider or plugin configuration.
