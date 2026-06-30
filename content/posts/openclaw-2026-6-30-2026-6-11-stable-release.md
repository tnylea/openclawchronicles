---
title: "OpenClaw 2026.6.11 Stable Release Lands"
excerpt: "OpenClaw 2026.6.11 ships channel control upgrades, safer plugin distribution, mobile settings panels, and stronger agent-turn reliability."
coverImage: '/assets/images/posts/openclaw-2026-6-30-2026-6-11-stable-release.png'
date: '2026-06-30T23:00:00.000Z'
dateFormatted: June 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-30-2026-6-11-stable-release.png'
---

OpenClaw has shipped the stable [2026.6.11 release](https://github.com/openclaw/openclaw/releases/tag/v2026.6.11), moving the June train forward from yesterday's beta into a broader production package. The release was published on June 30th and is also live on [npm as `openclaw@2026.6.11`](https://www.npmjs.com/package/openclaw/v/2026.6.11).

This is a large release. The official notes say the audited record covers 308 merged PRs between `v2026.6.10` and the release head, so the story is less about one isolated feature and more about the platform getting steadier across channels, providers, mobile operations, and plugin distribution.

## Channel Control Gets More Practical

The release highlights Slack relay mode, native Mattermost queue support, and per-DM model overrides as a package of channel-control improvements.

Slack relay mode, from [PR #94707](https://github.com/openclaw/openclaw/pull/94707), gives incoming Slack messages a more explicit routing path. Mattermost now has a native `/oc_queue` command through [PR #95546](https://github.com/openclaw/openclaw/pull/95546). Per-DM model overrides, from [PR #95120](https://github.com/openclaw/openclaw/pull/95120), let operators tune model behavior at the direct-message level instead of only at broader channel or gateway scopes.

Those changes matter because OpenClaw is no longer just a local CLI wrapped in chat. It is increasingly a multi-channel operations surface where identity, model choice, and message routing need to survive real team workflows.

## Operators Get Better Workflows

Two operator-facing additions stand out:

- [`openclaw agent --message-file`](https://github.com/openclaw/openclaw/pull/93351) for file-driven agent prompts
- The [RAFT CLI wake bridge](https://github.com/openclaw/openclaw/pull/95497) for remote wake-up paths

The `--message-file` flag is a small but useful CLI shape: long instructions can live in a file instead of being squeezed into shell quoting. The RAFT wake bridge is more infrastructure-oriented, giving remote channel systems a path to wake OpenClaw work through the CLI.

Both are signs that OpenClaw's operational model is maturing around repeatable runs, not just ad hoc chat messages.

## Plugin Distribution Keeps Tightening

OpenClaw 2026.6.11 also continues the plugin-distribution cleanup that has been building all month. The release notes call out additional official plugins being externalized cleanly in [PR #95683](https://github.com/openclaw/openclaw/pull/95683), plus bundled plugin icon manifest URLs in [PR #95845](https://github.com/openclaw/openclaw/pull/95845).

That sounds cosmetic until you connect it to the rest of the ClawHub trust work. Clearer externalized plugins and predictable icon metadata make installed clients easier to audit and present. They also reduce the ambiguity around what is bundled, what is registry-managed, and what came from the marketplace.

## Mobile and Agent Runtime Improvements

The release includes stronger mobile operations through [Android settings detail panels](https://github.com/openclaw/openclaw/pull/95148). That gives mobile node users more direct configuration visibility instead of forcing every detail back through desktop or CLI surfaces.

On the agent-runtime side, the release points to three reliability fixes:

- Codex partial deltas stream as partials instead of waiting for final answer boundaries
- Selected harness plugins activate more consistently
- Long-context tool-result prompts stay cache-stable

Those correspond to [PR #95404](https://github.com/openclaw/openclaw/pull/95404), [PR #95652](https://github.com/openclaw/openclaw/pull/95652), and [PR #95624](https://github.com/openclaw/openclaw/pull/95624). Together, they reduce the chance that long-running agent turns lose progress, select the wrong runtime shape, or become inconsistent around prompt-cache behavior.

## Verification and Upgrade Notes

The release page includes npm integrity, release SHA, CI evidence, postpublish evidence, macOS artifacts, Windows companion installers, and Windows Hub promotion proof. The npm package reports provenance attestations and the published integrity:

```bash
npm install -g openclaw@2026.6.11
```

For operators, the short version is clear: this stable release is worth tracking if you rely on Slack, Mattermost, WhatsApp, Telegram, mobile nodes, Codex harness runs, or ClawHub plugin distribution. It is a broad reliability release with enough channel and provider surface area to matter in production gateways.
