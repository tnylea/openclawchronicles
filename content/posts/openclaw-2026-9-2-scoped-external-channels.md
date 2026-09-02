---
title: "OpenClaw Fixes Scoped External Channels"
excerpt: "OpenClaw message commands can now resolve scoped external plugin channels for direct sends and broadcast planning."
coverImage: '/assets/images/posts/openclaw-2026-9-2-scoped-external-channels.png'
date: '2026-09-02T08:01:00.000Z'
dateFormatted: September 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-2-scoped-external-channels.png'
---

OpenClaw merged a high-priority messaging fix this morning with [PR #135831](https://github.com/openclaw/openclaw/pull/135831), `fix(message): resolve explicit channels through the scoped plugin registry`. The change repairs a channel-selection failure that affected installed external plugins when operators used the message CLI.

The concrete symptom was simple: an explicit external channel could be registered for the current request, but `openclaw message <action> --channel <external-channel>` still failed before the request-scoped registry had a chance to resolve it. The same process-root-only check also affected configured-channel discovery and unscoped broadcast account planning.

## What Changed

OpenClaw now lets the outbound channel resolver own channel availability and registry lookup. Instead of repeating a process-root channel ID check, channel selection and broadcast planning read the request-scoped registry through the resolver that already understands what is available for the current action.

That matters for plugin authors and operators using external messaging integrations. The selected plugin ID becomes the canonical channel ID, which keeps external aliases from being passed downstream as a different provider. The PR deliberately avoids adding a compatibility alias, core fallback, or special-case plugin ID.

The user-facing result is narrower and cleaner:

- Explicit external plugin channels can be used by `openclaw message`.
- Configured external channels can be discovered and planned for broadcast.
- Visible-but-unavailable channels remain distinct from unknown channel IDs.
- Cross-provider policy still sees the canonical selected plugin.

## Why It Matters

External channels are part of OpenClaw's extensibility story. Teams can add transport plugins without every path being baked into the core process at startup. But that only works if command-time discovery and request-scoped plugin loading are honored consistently.

The bug was especially awkward because the plugin could record its own registration while the CLI still rejected the channel as unknown. Operators saw a failure before any send happened, even though the action had loaded the plugin intended to handle it.

By moving selection back through the outbound resolver, the fix keeps the decision in the owner that already handles channel availability. That reduces drift between direct sends, configured-channel discovery, and broadcast account planning.

## Proof From The Merge

The PR includes a before-and-after command probe. On current main, a real `message send` action loaded the task plugin and exited with `Unknown channel`; the plugin recorded registration but no send. On the candidate, the same action exited successfully and the plugin recorded the exact target and text.

The regression proof also covered changed inputs. A second process used a different target and text, and the plugin recorded both changed values. That helps rule out a hard-coded pass or stale fixture.

Focused owner tests reported 43 passes. Sibling message CLI, command, routing, and plugin-dispatch tests reported 111 passes. The targeted formatting, linting, and `git diff --check` gates passed, and Codex autoreview reported no accepted P0 findings.

## Operator Takeaway

If you use external plugin channels with OpenClaw's message CLI, PR #135831 removes a false `Unknown channel` failure from scoped channel resolution. It keeps the canonical channel decision inside the outbound resolver while preserving the existing policy boundary around provider identity.
