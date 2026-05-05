---
title: "OpenClaw Gets Crestodian Plugin Management via CLI"
excerpt: "OpenClaw now supports plugin search, install, and uninstall via Crestodian and CLI, with approval gates blocking executable code over message channels."
coverImage: '/assets/images/posts/openclaw-2026-5-2-crestodian-plugin-management.png'
date: '2026-05-02T08:00:00.000Z'
dateFormatted: May 2nd 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-2-crestodian-plugin-management.png'
---

Managing OpenClaw plugins just got a lot easier. [PR #75869](https://github.com/openclaw/openclaw/pull/75869), merged today by maintainer Peter Steinberger (steipete), brings full Crestodian plugin management — search, list, install, and uninstall — to both the CLI and OpenClaw's agentic operations layer.

## What Is Crestodian?

Crestodian is OpenClaw's self-management subsystem: the layer that lets your agent handle its own configuration and runtime state within safe guardrails. Until now, that excluded plugin lifecycle management. Installing or removing a plugin meant a developer stepping in at the terminal, breaking the automation loop.

## A New CLI Command: `openclaw plugins search`

The headline addition is `openclaw plugins search`. The command queries ClawHub for installable code-plugin and bundle-plugin packages, clamps results to a configurable limit, supports `--json` output for scripting, and prints install hints alongside each result. It reuses existing ClawHub infrastructure rather than introducing a new dependency.

The companion `openclaw plugins list` lists currently installed plugins. Both are read-only and require no approval step.

## Crestodian Gets Plugin Operations

The bigger change is that Crestodian now understands four plugin operations:

- **plugin list** — Read-only. Returns the current installed plugin inventory.
- **plugin search** — Read-only. Searches ClawHub for available packages.
- **plugin install** — Approval-gated. Runs the standard install flow and writes an audit entry after config mutation.
- **plugin uninstall** — Approval-gated. Triggers the existing uninstall planner with channel config cleanup.

This means an agent operating in CLI or supervised contexts can now manage its own plugin stack as a first-class operation — with full audit trails on every mutation.

## The Safety Boundary That Matters

The PR draws a deliberate line around remote rescue flows. When a Crestodian-capable agent receives a recovery message over a chat channel, it can perform many self-repair operations — but plugin install is explicitly blocked. The reasoning is direct: installing executable code in response to an unverified message is a supply-chain attack vector.

The boundary is enforced in `src/crestodian/rescue-message.ts`, and the Codex automated review confirmed it holds at merge time. Read operations (list, search) pass through remote rescue. Mutations (install, uninstall) require the CLI or an explicitly configured approval path.

## Cleaner Internals Too

The PR also extracts the `uninstall` command into a reusable wrapper rather than duplicating behavior across call sites. Future plugin operations — including the in-progress [#75186](https://github.com/openclaw/openclaw/pull/75186) Gateway RPC plugin management work — will compose against this shared path.

## Why It Matters

Plugin management friction has been a recurring pain point for users running OpenClaw headlessly or in Docker. Before this change, adding a new skill meant leaving the automation loop entirely. Now, with Crestodian-native plugin operations, agents in supervised contexts can manage their own integrations as part of normal workflow — without sacrificing the approval gates that keep installs safe.

This lands in `main` today and ships in the next tagged release after v2026.4.29. Try it now by building from source:

```bash
openclaw plugins search <query>
openclaw plugins list
```
