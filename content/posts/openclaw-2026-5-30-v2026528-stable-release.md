---
title: "OpenClaw v2026.5.28 Stable: Copilot Runtime, Opus 4.8, iOS Talk"
excerpt: "OpenClaw v2026.5.28 stable is out with GitHub Copilot agent runtime, Claude Opus 4.8, realtime iOS Talk, and new policy conformance checks."
coverImage: '/assets/images/posts/openclaw-2026-5-30-v2026528-stable-release.png'
date: '2026-05-30T23:00:00.000Z'
dateFormatted: May 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-30-v2026528-stable-release.png'
---

OpenClaw v2026.5.28 shipped as a stable release today at 20:06 UTC, graduating several weeks of betas into the canonical production build. This is a dense release — runtime recovery, new provider support, a refreshed iOS app, tighter channel security, and the first stable version of several features that were in beta since late May.

Here is what landed.

## GitHub Copilot Agent Runtime and Codex Supervisor

The headline addition on the provider side is first-class support for the **GitHub Copilot agent runtime**. OpenClaw can now delegate Codex workflows through a Codex Supervisor plugin package, creating a structured path for multi-step delegated Codex work rather than raw subprocess management.

Both GitHub Copilot and the Tokenjuice plugin have been externalized as official install-on-demand packages with ClawHub publish metadata, meaning they show up in the marketplace and can be installed with a single `openclaw plugins install` command rather than being bundled in core.

## Claude Opus 4.8 Support

Provider coverage expands with **Claude Opus 4.8** added to the model catalog ([#87845](https://github.com/openclaw/openclaw/pull/87845)). Alongside Opus 4.8, this release adds Fal Krea image model schemas, NVIDIA featured model catalogs, MiniMax streaming music responses, and provider-backed voice model catalogs ([#87890](https://github.com/openclaw/openclaw/pull/87890), [#80775](https://github.com/openclaw/openclaw/pull/80775), [#84764](https://github.com/openclaw/openclaw/pull/84764), [#87794](https://github.com/openclaw/openclaw/pull/87794)).

One notable CLI fix: OpenClaw will no longer automatically migrate Claude Haiku 4.5 profiles to Sonnet — a migration that was causing unwanted model drift for users who had explicitly pinned Haiku.

## iOS App Major Refresh

The iOS Pro app gets a significant overhaul in this release. The new build wires up the full tab set — **Command, Chat, Agents, Settings** — with hosted push relay defaults and **realtime Talk tab playback** connected to gateway sessions ([#87367](https://github.com/openclaw/openclaw/pull/87367), [#88096](https://github.com/openclaw/openclaw/pull/88096), [#88105](https://github.com/openclaw/openclaw/pull/88105)). Previously the Talk tab existed but playback was not properly routed through the gateway session lifecycle.

Contributors [@ngutman](https://github.com/ngutman), [@Solvely-Colin](https://github.com/Solvely-Colin), and [@BunsDev](https://github.com/BunsDev) drove this work.

## Policy Conformance Checks

A new policy enforcement layer lands in stable: **policy comparison**, **ingress-channel conformance**, and **sandbox-posture conformance** checks ([#85572](https://github.com/openclaw/openclaw/pull/85572), [#85744](https://github.com/openclaw/openclaw/pull/85744), [#86768](https://github.com/openclaw/openclaw/pull/86768)). These let operators define a baseline security posture and validate that a running OpenClaw instance actually matches it — catching drift between what the config says and what is actually active.

This is meaningful for enterprise deployments where regulatory or internal compliance requirements need a verifiable audit trail on agent security posture.

## Workboard Officially Ships

The Workboard plugin gets its first stable release with **agent coordination tools for tracking and handing off active agent work**. This pairs with the active PR ([#88259](https://github.com/openclaw/openclaw/pull/88259)) adding namespaces and recovery tools — covered in this morning's post — which is expected to arrive in an upcoming release once review completes.

The stable baseline gives multi-agent deployments a reliable coordination layer to build on while the more advanced namespace and recovery features work through review.

## ClawHub Trust and Verification Surfaces

ClawHub gets a UX pass in this release: **plugin display names, skill verification badges, and trust surfaces** are now surfaced directly in the marketplace ([#87354](https://github.com/openclaw/openclaw/pull/87354)). This makes it easier to identify verified community skills versus unverified ones at install time — a step toward a more curated ecosystem as ClawHub's catalog continues to grow.

## Runtime Recovery and Channel Hardening

The runtime stability work in this release is extensive. Highlights:

- **Subagents** keep cwd/workspace state properly separated from the parent agent, and hook context stays prompt-local rather than leaking across sessions ([#87218](https://github.com/openclaw/openclaw/pull/87218))
- **Session locks** release cleanly on timeout abort while live OpenClaw-owned locks survive the cleanup cycle ([#88129](https://github.com/openclaw/openclaw/pull/88129))
- **Channels** get a broad hardening pass: Matrix room-id case preservation, iMessage polling after denied reactions, Slack final reply retention, Telegram SecretRef config, WhatsApp profile auth roots, Discord voice helper preservation, and Microsoft Teams service URL trust validation ([#73706](https://github.com/openclaw/openclaw/pull/73706), [#87451](https://github.com/openclaw/openclaw/pull/87451), [#87334](https://github.com/openclaw/openclaw/pull/87334), and more)
- **Config parsing** now rejects partial numeric parsing, honors IPv6 no_proxy entries, and validates cron epoch values, schema array refs, and unsafe Telegram callback pages ([#87883](https://github.com/openclaw/openclaw/pull/87883))

## Encrypted PDFs and ClawPDF

Document handling gets a meaningful upgrade: OpenClaw now uses **ClawPDF** for PDF extraction and adds **encrypted PDF support** ([#87670](https://github.com/openclaw/openclaw/pull/87670), [#87751](https://github.com/openclaw/openclaw/pull/87751)). MCP structured content is also surfaced directly in agent tool results.

## Upgrading

Update with `openclaw update` or pull the latest from the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.5.28). The `openclaw doctor` command now produces more actionable restart guidance — worth running after the upgrade to catch any auth profile migration or plugin state issues.
