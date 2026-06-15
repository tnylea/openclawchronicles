---
title: "OpenClaw Adds Auto Plugin Approvals for Codex Apps"
excerpt: "OpenClaw merged Codex auto plugin approvals, routing destructive native connector requests through existing approval flows instead of silent default accepts."
coverImage: '/assets/images/posts/openclaw-2026-6-15-codex-auto-plugin-approvals.png'
date: '2026-06-15T08:00:00.000Z'
dateFormatted: June 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-15-codex-auto-plugin-approvals.png'
---

OpenClaw's Monday morning main branch picked up a meaningful Codex integration change: [PR #92625](https://github.com/openclaw/openclaw/pull/92625) adds `auto` plugin approvals for native Codex plugin actions.

The headline is simple. When a Codex native connector asks to perform a destructive action, OpenClaw can now route that request through OpenClaw's existing plugin approval flow instead of treating the setting as a blunt accept-or-deny switch. The PR also retires `on-request` as a steady-state runtime value for the Codex native plugin destructive approval setting and moves the supported config language to `allow_destructive_actions: "auto"`.

That is a small naming change with a larger product consequence. It makes Codex connector elicitations fit the same approval language operators already use for OpenClaw plugin actions.

## What Changed

The merged PR does five practical things.

- Renames the Codex native plugin destructive approval setting from `on-request` to `auto`.
- Routes `allow_destructive_actions: "auto"` Codex app-server elicitation requests through OpenClaw plugin approvals.
- Keeps boolean `true` as a separate internal allow mode for schemas that are already considered safe.
- Adds doctor, migration, and persisted binding repair paths for older shipped `on-request` values.
- Updates Codex plugin docs, manifest schema help, config parsing, migration defaults, and focused tests.

The key boundary is that `auto` does not mean "silently approve everything." It means destructive Codex connector requests can become visible OpenClaw approval requests, with the same review surface used elsewhere in the system.

## Why This Matters

Codex native plugins are most useful when they connect agents to real services: calendars, files, issue trackers, messaging systems, and other places where a mistaken action can have external consequences. If those plugins need human approval, the approval has to be visible, routed, and recoverable.

PR #92625's real behavior proof used a Google Calendar native plugin action that created an event. The request surfaced as an OpenClaw plugin approval in Slack and continued only after user approval. That is exactly the shape operators want for high-impact connector actions: the model can propose the action, but OpenClaw still mediates the final decision.

The migration work is important too. Configuration names tend to outlive the release that introduced them, and approval language is especially sensitive because users read it as a safety contract. By adding normalization through doctor, migration planning, and app-server binding v1 handling, the project reduces the chance that old `on-request` values turn into broken or ambiguous behavior.

## A Broader Codex Cleanup Morning

The approval PR was not the only Codex-related merge in the overnight window. [PR #91767](https://github.com/openclaw/openclaw/pull/91767) closes the Codex app-server shared client after one-shot OpenClaw agent runs finish, so CLI and gateway sessions do not leave app-server or Agent Hub proxy children behind.

Another gateway fix, [PR #93011](https://github.com/openclaw/openclaw/pull/93011), accepts file-only `/v1/responses` turns the same way image-only turns are already accepted. The file content is still parsed into prompt context, but the active user turn no longer fails just because it has no text body.

Together, those changes point in the same direction: Codex inside OpenClaw is getting less special-case behavior and more explicit lifecycle handling.

## Operator Takeaway

If you run Codex-backed OpenClaw sessions, watch for `auto` to become the config word around destructive native plugin approvals. The interesting part is not just the rename. It is the routing model: connector actions that need a human decision should flow through OpenClaw's approval machinery instead of hiding inside provider-specific semantics.

Read the source PRs on GitHub: [#92625](https://github.com/openclaw/openclaw/pull/92625), [#91767](https://github.com/openclaw/openclaw/pull/91767), and [#93011](https://github.com/openclaw/openclaw/pull/93011).
