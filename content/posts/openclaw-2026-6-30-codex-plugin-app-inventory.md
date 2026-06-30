---
title: "OpenClaw Keeps Codex Plugin Apps Available"
excerpt: "OpenClaw PR #98042 keeps configured Codex plugin apps available when a new thread starts with missing app inventory."
coverImage: '/assets/images/posts/openclaw-2026-6-30-codex-plugin-app-inventory.png'
date: '2026-06-30T08:01:00.000Z'
dateFormatted: June 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-30-codex-plugin-app-inventory.png'
---

OpenClaw merged [PR #98042](https://github.com/openclaw/openclaw/pull/98042) this morning to make Codex-backed threads more reliable when plugin app inventory is missing at startup.

The bug was easy to feel and hard to explain: a user could start a Codex-backed OpenClaw thread with configured plugin-owned apps, but those apps could disappear from the new thread if the process-local app inventory snapshot had not been populated yet.

The same PR also fixes remote curated plugin lookups that need Codex's backend remote plugin ID rather than a display name, and it makes Guardian review the first turn of eligible native OpenAI threads.

## Inventory Before Thread Config

The core startup fix is direct. When OpenClaw builds app config for a new Codex thread and the local inventory is missing, it refreshes that inventory before deciding which apps are available.

The PR says the refresh paginates until the configured app IDs are found or the inventory is exhausted. It also rejects repeated cursors instead of caching a known-partial result. That detail matters because a partial inventory is worse than no inventory: it can make configured apps look absent when they are merely not loaded yet.

For operators, the result is simpler. Configured Codex plugin apps should remain available on new OpenClaw threads even when the local inventory snapshot starts empty.

## Remote Plugin Activation Gets Cleaner

Remote curated plugins also get a wiring fix. PR #98042 consistently uses Codex's `remotePluginId` for reads and installs, and it searches each accepted curated marketplace for the requested plugin instead of assuming the first curated marketplace owns it.

That should help setups where Codex returns both local and remote marketplace entries. OpenClaw no longer has to guess that the first curated entry is the right catalog.

The PR notes that genuinely absent or inaccessible apps still fail closed. This is not a permissive fallback. It is a correction to how OpenClaw finds apps that are already configured and available through the current Codex app-server contract.

## Guardian On The First Turn

The final user-facing piece is Guardian review on first turns. After a fresh thread confirms its active model provider, OpenClaw recomputes only the approval reviewer used for the first `turn/start`.

Eligible native OpenAI threads get Guardian review on that first turn. Local and custom OpenAI-compatible providers continue to fall back to human review.

That is a useful balance. The first turn is often where users paste the task, secrets, files, or messy instructions. If Guardian is supposed to be reviewing a thread, it should not miss the first exchange because provider identity was confirmed slightly too late.

## Evidence And Caveats

The PR reports focused test coverage for inventory behavior, marketplace fixes, first-turn Guardian behavior, formatting, linting, and diff checks. It also includes a prior live Slack/OpenClaw integration run that exercised Calendar and Linear app behavior, including an approval prompt and an expired untouched approval.

The author is explicit that the live Slack flow was not rerun after the final review and Guardian commits. That caveat is worth preserving. The code-level tests cover the final changes; the live app flow is supporting evidence rather than the final proof.

For OpenClaw users building Codex-backed workflows, the practical takeaway is still strong: configured plugin apps should be less likely to vanish at thread startup, remote curated plugins should activate through the right identifier, and first-turn Guardian coverage should be more consistent.
