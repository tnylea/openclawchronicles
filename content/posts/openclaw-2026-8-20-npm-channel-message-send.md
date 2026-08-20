---
title: "OpenClaw Restores npm Channel Message Sending"
excerpt: "OpenClaw fixes message CLI targeting for npm-installed channel plugins, restoring sends through LINE and other external channels."
coverImage: '/assets/images/posts/openclaw-2026-8-20-npm-channel-message-send.png'
date: '2026-08-20T23:03:00.000Z'
dateFormatted: August 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-20-npm-channel-message-send.png'
---

OpenClaw's message CLI received a focused regression fix in [PR #126700](https://github.com/openclaw/openclaw/pull/126700): `openclaw message send` can once again address channels supplied by npm-installed plugins.

The bug was easy to miss if you mostly use bundled channels. Telegram and other built-in transports were unaffected. But for LINE and other non-bundled channel plugins, OpenClaw 2026.8.1-beta.2 could report `Unknown target` even when the channel was configured, enabled, and visible in `plugins list`.

## The Scoped Registry Gap

The root cause was a mismatch between channel selection and target resolution. Since an earlier change, the message CLI loads channel plugins through a scoped registry handle rather than activating them in the process-root registry. Channel selection and send execution understood that scoped registry.

Target resolution still used a bare channel-plugin lookup that could only see process-root activations plus bundled fallbacks. In other words, the CLI could know which external channel it intended to use, then forget how to resolve that channel's targets at the exact point where user IDs, prefixed IDs, and hints mattered.

The merged fix repairs three related edges:

- The message-action path carries the selected plugin into target resolution.
- Fallback target lookups use the same scoped registry composition as account validation.
- Configured-channel listing and target-prefix inference can see runtime-visible scoped channel plugins.

That last point matters for commands without an explicit `--channel`. Before this fix, a scoped-only channel could fail earlier with a misleading "no configured channels detected" path instead of reaching the plugin's own target rules.

## What Users Get Back

The practical result is simple: message sends through npm-installed channel plugins work again. The PR specifically cites LINE as the reproduced environment, with bare IDs, `line:`-prefixed IDs, and no-`--channel` prefixed target forms all delivering after the patch.

The repair also keeps existing behavior for bundled channels and Gateway or agent delivery paths. Explicitly passed plugin parameters still win, and processes that activate a root registry continue to resolve as they did before.

This is a useful example of OpenClaw's plugin architecture maturing at the edges. The system already had scoped registry ownership for safer, more deliberate plugin loading. The missing part was making every downstream resolution step honor that same owner instead of falling back to older global assumptions.

## Evidence From the PR

The PR includes live repro notes against the published `openclaw@2026.8.1-beta.2` package on Windows 11 with a version-matched `@openclaw/line` plugin and real LINE Messaging API delivery.

It also adds red/green regression coverage for registry-scoped resolver behavior, single-configured-channel selection, runtime-visible channel merging, and no-scope controls. The author notes that target resolution now keeps the existing single-resolution contract: the selected plugin is threaded through instead of being rediscovered later.

For operators building around external messaging channels, this is a high-value CLI reliability fix. The important detail is not just that LINE works again, but that npm-installed channel plugins now participate in the same runtime-visible channel model as the rest of the message CLI.
