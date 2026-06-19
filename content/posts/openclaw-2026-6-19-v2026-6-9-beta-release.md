---
title: "OpenClaw 2026.6.9 Beta Expands Chat Delivery"
excerpt: "OpenClaw 2026.6.9 beta brings richer Telegram delivery, stronger agent recovery, Codex updates, official provider plugins, and client polish."
coverImage: '/assets/images/posts/openclaw-2026-6-19-v2026-6-9-beta-release.png'
date: '2026-06-19T23:05:00.000Z'
dateFormatted: June 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-19-v2026-6-9-beta-release.png'
---

OpenClaw's latest beta is out. The project published [v2026.6.9-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.6.9-beta.1) on June 19, and the release is a broad usability pass across Telegram delivery, agent recovery, Codex integration, provider packaging, web clients, and skill installation.

The headline is not one single feature. It is a cluster of fixes and workflow improvements that make OpenClaw feel more dependable when agents are running through real messaging channels and external providers.

## Richer Telegram Delivery

The first highlight in the release notes is Telegram. OpenClaw says Telegram now sends richer HTML, preserves markdown and sticker paths more faithfully, renders progress drafts and command output better, and keeps mentions plus spooled handlers on the right delivery path.

That matters because Telegram is often used as an everyday control surface, not just a notification channel. When progress drafts, command output, mentions, and rich message formatting survive the trip cleanly, users have a better chance of understanding what the agent is doing without opening a separate dashboard.

The release credits a set of Telegram-related PRs including [#93286](https://github.com/openclaw/openclaw/pull/93286), [#93164](https://github.com/openclaw/openclaw/pull/93164), [#93124](https://github.com/openclaw/openclaw/pull/93124), [#93364](https://github.com/openclaw/openclaw/pull/93364), [#93130](https://github.com/openclaw/openclaw/pull/93130), [#93088](https://github.com/openclaw/openclaw/pull/93088), and [#93281](https://github.com/openclaw/openclaw/pull/93281).

## Better Recovery For Partial Runs

The release also focuses on agent recovery. The notes call out retries, terminal outcomes, usage after compaction, session history repair, and reply reconciliation as areas that now keep more interrupted or partial turns moving toward a visible final result.

That is the kind of reliability work that does not always look dramatic in a changelog, but it is central to a persistent agent system. OpenClaw agents often run long enough to hit provider errors, compaction boundaries, transport interruptions, or channel-specific reply issues. Better recovery means fewer runs end in a confusing half-state.

The release groups several PRs under this recovery theme, including [#92191](https://github.com/openclaw/openclaw/pull/92191), [#93073](https://github.com/openclaw/openclaw/pull/93073), [#93228](https://github.com/openclaw/openclaw/pull/93228), [#93084](https://github.com/openclaw/openclaw/pull/93084), [#93469](https://github.com/openclaw/openclaw/pull/93469), [#93291](https://github.com/openclaw/openclaw/pull/93291), and [#90943](https://github.com/openclaw/openclaw/pull/90943).

## Codex And Provider Packaging

OpenClaw 2026.6.9 beta also continues the Codex integration work that has been showing up throughout the week. The release notes mention automatic plugin approvals, GPT-5.3 Spark OAuth routing, remote-node `exec` as a dynamic tool, and more reliable app-server teardown and terminal outcomes.

Provider packaging is another important line item. Official provider plugins are now standalone npm releases, externally installed channel plugins load at Gateway startup, and StepFun is intentionally npm-only because its ClawHub package name is unavailable.

That shift makes provider distribution more modular. It should also make it easier to reason about which provider packages are installed, updated, and loaded by a given Gateway.

## Web, Native, Search, And Skills

The beta includes client-facing updates too. The Control UI adds a session workspace rail and extension health, iOS adds Watch controls, and Android shows chat context. Those features sit alongside search and skill changes: Codex Hosted Search is available, key-free search providers remain explicit opt-ins, and ClawHub skill installs retain verified source provenance.

The skill provenance note is worth calling out. As ClawHub grows, install identity becomes more important. Preserving verified source information helps users distinguish similarly named skills and understand where an install came from.

## Security And Privacy Fixes

The fix list includes several security and privacy items: debug and config output redaction, blocked internal HTTP session overrides, open-DM tool exposure auditing, and plugin write ownership checks.

Those are not flashy features, but they are exactly the kind of maintenance OpenClaw needs as more users expose agents to messaging channels, plugins, and remote execution surfaces.

## The Bottom Line

[OpenClaw 2026.6.9-beta.1](https://github.com/openclaw/openclaw/releases/tag/v2026.6.9-beta.1) is a large beta focused on channel fidelity, recovery, provider modularity, and operational safety.

For most users, the most visible change will be better Telegram behavior and smoother client workflows. For operators and plugin authors, the deeper story is that OpenClaw keeps turning rough integration edges into explicit, testable system behavior.
