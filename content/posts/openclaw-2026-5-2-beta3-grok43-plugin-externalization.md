---
title: "OpenClaw 2026.5.2 Beta: Grok 4.3 Default and Plugin Externalization Wave"
excerpt: "OpenClaw drops two beta builds on May 2nd, making Grok 4.3 the default xAI model and externalizing ACPX, OTEL, and a dozen channel plugins."
coverImage: '/assets/images/posts/openclaw-2026-5-2-beta3-grok43-plugin-externalization.webp'
date: '2026-05-02T23:00:00.000Z'
dateFormatted: May 2nd 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-2-beta3-grok43-plugin-externalization.webp'
---

Two beta builds landed within two hours of each other tonight. OpenClaw tagged v2026.5.2-beta.2 at 20:40 UTC and v2026.5.2-beta.3 at 22:15 UTC on May 2nd — a rapid-fire release cadence that signals the 2026.5.2 milestone is nearly ready for stable. The morning already brought posts on thread bindings, Crestodian, and session I/O; tonight's builds carry a different set of headline changes.

## Grok 4.3 Is Now the Default xAI Model

The biggest single-line change in both betas: xAI's Grok 4.3 has been added to OpenClaw's bundled model catalog and promoted to the **default xAI chat model**. If you have an xAI API key configured, your agents will start using Grok 4.3 automatically after updating — no config changes required.

This follows the same pattern OpenClaw used when it promoted Claude Sonnet 4 and GPT-4o as defaults for their respective providers. It keeps installations on a capable, current model without requiring every user to manually update their `model:` keys.

## Plugin Externalization: ACPX and OpenTelemetry Leave Core

The most architecturally significant change in these betas is a wave of plugin externalization. OpenClaw has been moving optional subsystems out of the core npm package and into dedicated plugins, and this release pushes that effort significantly further:

- **ACPX** is now behind the official `@openclaw/acpx` package. Packaged installs keep ACP harness adapter binaries out of core until explicitly installed.
- **Diagnostics OpenTelemetry** moves to `@openclaw/diagnostics-otel`, keeping the full OTEL dependency stack out of core installations.
- **Diagnostics Prometheus** is similarly externalized for 2026.5.1-beta.2 ClawHub publishing.

This is a meaningful footprint reduction for users who don't need enterprise observability. A lean OpenClaw install stays lean.

## A Dozen Channel Plugins Head to ClawHub

Beyond ACPX and OTEL, the release prepares a large batch of channel plugins for npm and ClawHub publishing:

- **Discord, WhatsApp, Microsoft Teams, Matrix** — all staged for beta.1 publish
- **Google Chat, LINE, Mattermost, Nextcloud Talk** — staged for beta.2
- **BlueBubbles, Google Meet, Nostr, Zalo, Zalo Personal** — also in the beta.2 wave
- **Brave, Codex, Feishu, Synology Chat, Tlon, Twitch** — beta.1 batch

Once these land on ClawHub, users will be able to install only the channels they actually use rather than shipping all of them in the core bundle. The `openclaw plugins install clawhub:@openclaw/discord` pattern is getting closer to being the standard way to set up a channel.

## Gateway Startup and Hot-Path Performance

Both betas include targeted performance work for large or plugin-heavy installs:

- **Startup secrets preflight**: plugin-backed auth-profile overlays are now skipped during the startup secrets check, reducing gateway readiness latency. OAuth recovery and reload paths remain overlay-capable.
- **Plugin registry reuse**: the startup-loaded plugin registry is now reused for request-time providers, tools, channel actions, and memory helpers — eliminating repeated registry resolution on stable embedded runs.
- **Descriptor caching**: plugin tool descriptors registered via `api.registerTool()` are now cached, so repeated prompt-time planning can skip plugin runtime loading entirely. Execution still loads the live plugin tool.
- **Path guard fast path**: a new fast path for canonical absolute POSIX containment checks avoids repeated `path.resolve` and `path.relative` work in hot filesystem walkers ([#75895](https://github.com/openclaw/openclaw/issues/75895)).

Together, these changes should noticeably reduce startup time and per-request latency for setups with many plugins configured.

## SDK tools.invoke RPC

The Gateway SDK gains a new `tools.invoke` RPC with shared HTTP policy, typed approval and refusal results, and SDK helper support ([#74705](https://github.com/openclaw/openclaw/issues/74705)). This is the foundation for external systems to programmatically invoke and respond to tool calls through the Gateway — a building block that ecosystem tools like AgentPort and BetterClaw are well positioned to use.

## Other Notable Changes

- **Slack App Home tab**: a safe default App Home view is now published on `app_home_opened`, and the Home tab event is included in setup manifests. This fixes a longstanding issue ([#11655](https://github.com/openclaw/openclaw/issues/11655)) where Slack bots would show a blank Home tab.
- **Slack thread persistence**: bot-participated threads are tracked across Gateway restarts, so ongoing threaded conversations continue auto-replying after an upgrade or restart.
- **Discord persistence**: active buttons, selects, and forms now survive Gateway restarts until they expire, reducing broken multi-step Discord interactions during upgrades.
- **macOS menu bar**: recent session context rows move into a Context submenu, keeping the menu bar companion compact when many sessions are active.
- **skipOptionalBootstrapFiles**: a new `agents.defaults.skipOptionalBootstrapFiles` option lets you skip selected optional workspace files during bootstrap without disabling required setup ([#62110](https://github.com/openclaw/openclaw/pull/62110)).
- **Git plugin installs**: `openclaw plugins install git:https://...` now works with ref checkout, commit metadata, and `plugins update` support for recorded git sources.

## Upgrading

Both beta.2 and beta.3 carry the same 2026.5.2 feature set — beta.3 landed about 90 minutes after beta.2 with minor fixes. Run `npm install -g openclaw@beta` or `openclaw update --beta` to pick up the latest. Stable 2026.5.2 should follow within days at the current pace.

Full changelogs: [v2026.5.2-beta.3](https://github.com/openclaw/openclaw/releases/tag/v2026.5.2-beta.3) · [v2026.5.2-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.5.2-beta.2)
