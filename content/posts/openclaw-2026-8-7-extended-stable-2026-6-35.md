---
title: "OpenClaw Preps 2026.6.35 Extended Stable"
excerpt: "OpenClaw PR #119942 prepares extended-stable 2026.6.35 with 258 source-attributed reliability and security fixes."
coverImage: '/assets/images/posts/openclaw-2026-8-7-extended-stable-2026-6-35.png'
date: '2026-08-07T08:01:00.000Z'
dateFormatted: August 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-7-extended-stable-2026-6-35.png'
---

OpenClaw merged [PR #119942, "release: extended-stable 2026.6.35"](https://github.com/openclaw/openclaw/pull/119942) early Friday, preparing the next extended-stable maintenance line from published 2026.6.34.

This is not a public tag or npm publication by itself. The PR states plainly that no tag, npm publication, or non-npm publication is included. What it does do is prepare the source tree for `2026.6.35`, bumping core and bundled plugin package versions and assembling the validated change set that can become the extended-stable release.

That distinction matters for operators. The stable train is where OpenClaw gathers reliability and security fixes without dragging every unreleased protocol, SDK, config, or channel refactor into the maintenance branch.

## What Is In The Prep

The headline number is large: the PR applies 258 source-attributed, contract-safe reliability and security fixes.

The body describes the audit range as `c780d8b1c02a3c2baa12ee62d478f24e4827d9c2..8fc44585931decce2e821efac34a599b5845c08a`, with historical omission review back to 6.11. It also says source patches that require unreleased protocol, SDK, config, or channel refactors were carried forward rather than partially included.

That is the boring but important part of release engineering. Backports are only useful if they keep the maintenance line coherent. A fix that depends on half of an unreleased stack can be worse than no fix at all, because it changes the shape of the platform under operators who expected a conservative update.

## Broad Surface Area

The PR is labeled across much of OpenClaw's runtime: Gateway, CLI, commands, agents, diagnostics, memory, policy, and a long list of channels including Slack, Discord, Matrix, Telegram, Signal, WhatsApp Web, iMessage, Zalo, QQBot, Synology Chat, and others.

It also touches bundled extensions and plugins such as Codex, Copilot, OpenAI, Anthropic, Google, DeepSeek, Memory Core, Memory Wiki, Workboard, file transfer, webhooks, diagnostics backends, and model-provider integrations.

That breadth is exactly why extended-stable preparation deserves its own coverage even before a tag appears. The release branch is becoming the safer landing zone for operators who want the fixes but do not want to chase every current-main refactor.

## Validation Signals

The validation list includes TypeScript checks for extensions, npm-version preflight, focused core and plugin regression tests, and targeted slices for Markdown frontmatter, web tool helpers, Browser, Google Meet, iMessage, Zalo, and Tlon.

OpenClaw also reports GitHub advisory reconciliation with zero open or draft advisories. That does not mean every fix is security-related, but it is a useful signal that the maintenance release prep was checked against the advisory queue before merge.

## Why It Matters

For self-hosted agent operators, extended-stable releases are trust infrastructure. They answer a simple question: can I take the repair without absorbing unrelated platform movement?

PR #119942 is the prep work behind that answer. It gathers 258 vetted fixes, keeps dependency stacks intact, and leaves the actual publication step separate. Operators should watch for the corresponding tag or package publication, but the source branch work for OpenClaw 2026.6.35 is now in place.
