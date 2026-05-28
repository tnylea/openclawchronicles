---
title: "OpenClaw v2026.5.27 Beta: Security Hardening, Pixverse Video, and Codex Reliability"
excerpt: "OpenClaw's v2026.5.27-beta.1 pre-release tightens content security boundaries, debuts Pixverse video generation, and makes Codex app-server runs significantly more reliable."
coverImage: '/assets/images/posts/openclaw-2026-5-28-security-hardening-pixverse.png'
date: '2026-05-28T08:00:00.000Z'
dateFormatted: May 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-28-security-hardening-pixverse.png'
---

A new pre-release landed this morning: [v2026.5.27-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.5.27-beta.1) published at 05:54 UTC. It is a dense one — security fixes, a brand-new video generation provider, Codex stability improvements, and faster Gateway paths all ship together. Here is what changed.

## Security Hardening Across the Board

The headline story this release is a coordinated push to tighten content boundaries and privilege controls:

- **Group prompt isolation**: prompt text from group channels is now routed outside the system prompt, closing a class of prompt-injection vectors when agents participate in multi-user channels.
- **Hostname normalization**: repeated trailing dots in hostnames (e.g. `evil.host...`) are normalized before resolution, removing a bypass pattern for SSRF and allowlist checks.
- **Command wrapper blocking**: side-effecting shell wrappers and unsafe Node runtime environment overrides are now rejected at the execution boundary.
- **Tailscale exposure guard**: configurations that would expose the Gateway over Tailscale without auth are rejected at startup rather than silently accepted.
- **Admin-gated device approvals**: node and device-role approval actions now require admin authority, reducing the blast radius of compromised non-admin sessions.

These changes follow on from the [security-in-public roadmap post](https://openclaw.ai/blog/where-openclaw-security-is-heading) published May 15 and continue the project's stated focus on making the agent runtime understandable and auditable. Thanks to contributors [@eleqtrizit](https://github.com/eleqtrizit) and [@pgondhi987](https://github.com/pgondhi987) for the bulk of this work (PRs [#87144](https://github.com/openclaw/openclaw/pull/87144), [#87305](https://github.com/openclaw/openclaw/pull/87305), [#87292](https://github.com/openclaw/openclaw/pull/87292), [#87308](https://github.com/openclaw/openclaw/pull/87308), [#87146](https://github.com/openclaw/openclaw/pull/87146)).

## Pixverse Video Generation Provider

OpenClaw now ships a built-in [Pixverse](https://pixverse.ai) video generation provider. The integration adds:

- Full video generation capabilities through the Pixverse API
- API region selection so users can route requests to their preferred datacenter
- External plugin packaging support for distributing Pixverse-powered skills via ClawHub

This makes OpenClaw one of the first personal agent runtimes to natively support text-to-video in the same tool call surface as chat and image models. No extra middleware — just configure your Pixverse API key and it appears alongside your other providers.

## Codex App-Server Reliability

Codex users will notice a cluster of fixes that make the app-server path meaningfully more stable:

- **Model resolution**: Codex runtime models now resolve before generic routing, so Codex-specific model names stop falling through to unrelated providers.
- **Memory routing**: workspace memory now flows through tools rather than being injected directly, keeping memory queries inside the Codex tool-call boundary.
- **Client survival**: shared app-server clients survive both startup failures and spawned-helper crashes, meaning a bad helper no longer kills the whole session.
- **Hook relay persistence**: native hook relay generations survive restarts and rotate onto fresh fallbacks cleanly.

These fixes land via PRs [#87383](https://github.com/openclaw/openclaw/pull/87383), [#87403](https://github.com/openclaw/openclaw/pull/87403), [#87375](https://github.com/openclaw/openclaw/pull/87375), and [#87428](https://github.com/openclaw/openclaw/pull/87428), credited to [@yetval](https://github.com/yetval).

## Gateway and Reply Performance

[@keshavbotagent](https://github.com/keshavbotagent) continues their performance work from v2026.5.26. This release adds:

- **Metadata fingerprint caching**: plugin metadata fingerprints are cached so hot-path requests stop rediscovering the same config on every turn.
- **Auth snapshot caching**: auth environment snapshots are cached alongside auto-enabled plugin config.
- **Tool-search catalog reuse**: stable tool-search catalogs are reused across turns instead of rebuilt.
- **Timeout isolation**: visible replies no longer inherit hidden cleanup timeouts, so slow background work no longer delays the user-facing response.

## Provider and Model Improvements

Several provider integrations got attention:

- **OpenAI-compatible embeddings**: a core OpenAI-compatible embedding provider is now built in, supporting any OpenAI-style endpoint for local models or hosted services. Configure it once; it works for memory, search, and any skill that relies on embeddings. (PR [#85269](https://github.com/openclaw/openclaw/pull/85269), thanks [@dutifulbob](https://github.com/dutifulbob).)
- **DeepInfra full catalog**: browsing models during onboarding now loads the complete credential-aware catalog rather than a truncated list. (PR [#84549](https://github.com/openclaw/openclaw/pull/84549), thanks [@ats3v](https://github.com/ats3v).)
- **VLLM thinking params**: configured thinking parameters are now correctly wired through for VLLM providers.
- **Claude CLI OAuth**: OAuth overlays load correctly for PI auth profiles.
- **Bare Anthropic model IDs**: direct model IDs like `claude-opus-4` now resolve without requiring a full catalog match.

## Channel Delivery Fixes

A quieter but important set of fixes lands for multi-channel users:

- Telegram `sendMessage` actions now use durable outbound delivery with preserved `SecretRef` prompt config
- iMessage suppresses duplicate native exec approval prompts
- Slack keeps delivered final replies during late-cleanup windows
- Discord guild requester checks are tighter, and recovered tool-warning artifacts stay out of successful replies
- Google Chat stops incorrectly starting threads in DMs
- Matrix mention previews are stricter about mention-inert delivery

## ClawHub Plugin Metadata

A small but useful ClawHub improvement: plugin display metadata now flows through to catalog and package listings, so skills and plugins show cleaner, human-readable names instead of internal identifiers. (PR [#87354](https://github.com/openclaw/openclaw/pull/87354), thanks [@thewilloftheshadow](https://github.com/thewilloftheshadow).)

## How to Update

```bash
openclaw update
```

Or pin to the beta explicitly:

```bash
npm install -g openclaw@2026.5.27-beta.1
```

The full release notes and verification hashes are on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.27-beta.1).
