---
title: "OpenClaw 2026.8.1 Beta 2 Ships Security Upgrades"
excerpt: "OpenClaw 2026.8.1 Beta 2 adds secret egress host binding, GPT-5.6 runtime switching, SQLite snapshots, and safer installs."
coverImage: '/assets/images/posts/openclaw-2026-8-15-2026-8-1-beta-2-release.png'
date: '2026-08-15T08:01:00.000Z'
dateFormatted: August 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-15-2026-8-1-beta-2-release.png'
---

OpenClaw published [v2026.8.1-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.8.1-beta.2) early Saturday UTC, and the release is unusually broad even by OpenClaw standards. The headline is not one feature, but a tighter platform story: safer secrets, more controlled plugin installs, stronger backup commands, new runtime switching, and several operator-facing reliability fixes.

The release was published on August 15, 2026 at 05:36 UTC. It supersedes the previously tracked beta line with a new GitHub release carrying the 2026.8.1 changelog.

## Security Gets A Practical Upgrade

The most important security item is secret egress host binding. The release says OpenClaw now binds each shared-store secret to exact HTTPS destination hosts across the CLI, Gateway RPC, and Control UI. If a secret is not bound to the attempted destination, sentinel substitution fails closed before plaintext can leave.

That is a meaningful hardening step for agent systems because secrets are often passed through layered tools, plugin calls, and UI-triggered workflows. Host binding narrows where a credential can be used, and the fail-closed behavior gives administrators a sharper boundary than logging or warning after the fact.

The release also folds in plugin install provenance warnings. Arbitrary executable plugin sources now require an explicit `--force` acknowledgement in CLI and chat installs, while trusted ClawHub, bundled, official-catalog, and tracked-update flows stay lower friction. Crestodian installs are restricted to trusted sources.

## Runtime And Model Switching Expands

For model operators, v2026.8.1-beta.2 adds GPT-5.6 Ultra support and runtime switching across the OpenClaw and Codex engines. The release names Sol, Terra, and Luna support, with model, runtime, and thinking selection kept atomic through `/model` and fallback paths.

Fresh setup defaults also move forward: new API-key setup uses `openai/gpt-5.6`, while fresh Codex/OAuth setup uses `openai/gpt-5.6-sol`. Existing primary models, fallback selections, aliases, and explicit GPT-5.5 choices are preserved.

## State, Channels, And Backups

The new SQLite snapshot commands are another operator-friendly addition. OpenClaw now includes:

- `openclaw backup sqlite create`
- `openclaw backup sqlite list`
- `openclaw backup sqlite verify`
- `openclaw backup sqlite restore`

The release describes compact, verified global and per-agent database artifacts, with restore limited to fresh targets. That fresh-target rule is a sensible guardrail: backups are most useful when recovery is predictable and does not silently overwrite a live state directory.

Channel infrastructure also gets a shared plugin SDK monitor for durable admission, polling, pruning, claim identity validation, adoption handoff, and shutdown. IRC, Synology Chat, and Google Chat move to the shared lifecycle, reducing bespoke channel behavior.

## Operator-Facing Polish

There are several smaller but useful fixes around daily operation. The Control UI reload button for available updates now waits out the Gateway restart and reloads once the Gateway answers. macOS named app profiles now isolate state, preferences, Keychain entries, Gateway services, and duplicate-instance ownership while keeping host-global login and node services untouched.

OpenClaw also adds browser extension relay CDP compatibility for Puppeteer-based clients, local model setup improvements for Ollama, llama.cpp, and LM Studio, hosted Fish Audio speech support, dashboard MCP app widgets, and better profile/avatar handling in the Control UI.

## The Bottom Line

[OpenClaw v2026.8.1-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.8.1-beta.2) looks like a platform consolidation release. The standout changes are the security boundaries around secret destinations and plugin provenance, but the release also invests heavily in backup operations, runtime selection, channel lifecycle reuse, and UI recovery.

For teams running OpenClaw beyond a single local machine, this beta is worth reading closely before the next stable train lands.
