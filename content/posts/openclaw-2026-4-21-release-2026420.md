---
title: "OpenClaw 2026.4.20: Kimi K2.6 Default, OOM Guards, Mattermost Streaming"
excerpt: "OpenClaw 2026.4.20 ships with Moonshot Kimi K2.6 as the new default, session backlog OOM protection, live Mattermost draft streaming, and BlueBubbles group system prompts."
coverImage: '/assets/images/posts/openclaw-2026-4-21-release-2026420.png'
date: '2026-04-21T19:30:00.000Z'
dateFormatted: April 21st 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-21-release-2026420.png'
---

OpenClaw 2026.4.20 landed at 19:19 UTC today — a broad quality release that touches model defaults, session resilience, channel integrations, and cron internals. The morning build already shipped [three security fixes](/posts/openclaw-2026-4-21-security-triple-patch) and a [setup wizard polish pass](/posts/openclaw-2026-4-21-setup-wizard-ux); this post covers everything else in the stable release.

## Moonshot Kimi K2.6 Is Now the Default

The biggest UX change in this release is a default model swap. Both PRs [#69477](https://github.com/openclaw/openclaw/pull/69477) (surface routing) and [#68816](https://github.com/openclaw/openclaw/pull/68816) (thinking config) land together to make **Moonshot Kimi K2.6** the default for the bundled Moonshot integration — including setup, web search, and media-understanding surfaces. Kimi K2.5 stays available for anyone who needs backward compatibility.

Alongside the routing change, the release adds support for `thinking.keep = "all"` on K2.6 specifically, while stripping unsupported thinking flags for other Moonshot models and for requests where a pinned `tool_choice` disables reasoning entirely. The result is a cleaner reasoning experience out of the box without requiring manual config.

PR [#67605](https://github.com/openclaw/openclaw/pull/67605) completes the picture by adding **tiered model pricing** support so cached catalogs and configured models can carry per-tier cost data. Bundled Kimi K2.6 and K2.5 cost estimates now flow into token-usage reports — useful for anyone tracking spend across sessions.

## Session Backlog OOM Protection

PR [#69404](https://github.com/openclaw/openclaw/pull/69404) from [@bobrenze-bot](https://github.com/bobrenze-bot) addresses a real-world failure mode: gateways that run heavy cron or executor workloads could accumulate massive session stores over time, eventually triggering out-of-memory crashes before the write path had a chance to prune them.

The fix enforces the built-in entry cap and age prune **by default** (not just when explicitly configured) and adds a load-time prune that catches oversized stores on startup. Users who have been running long-lived gateways with many automated sessions should see more predictable memory footprints starting with this release.

## Cron State Split: jobs-state.json

PR [#63105](https://github.com/openclaw/openclaw/pull/63105) from [@Feelw00](https://github.com/Feelw00) is a quiet but useful architectural change: runtime execution state is now split into a separate **`jobs-state.json`** file, leaving `jobs.json` stable and appropriate for git-tracking.

Previously, committing your cron job definitions to version control meant dealing with runtime state noise mixed into the same file. The split keeps job definitions clean and declarative while letting the gateway write execution state wherever it likes.

## Mattermost Gets Live Draft Streaming

PR [#47838](https://github.com/openclaw/openclaw/pull/47838) from [@ninjaa](https://github.com/ninjaa) brings OpenClaw's streaming reply model to Mattermost. Thinking blocks, tool activity, and partial reply text now flow into a single **draft preview post** that finalizes in place when the turn completes safely.

This matches the pattern that Discord and Slack users have had for a while — watching the agent "type" in real time rather than waiting for a completed message to appear. For Mattermost deployments used in team workflows (especially engineering bots that run tool-heavy tasks), this is a meaningful UX improvement.

## BlueBubbles: Per-Group System Prompts

PR [#69198](https://github.com/openclaw/openclaw/pull/69198) from [@omarshahine](https://github.com/omarshahine) closes [#60665](https://github.com/openclaw/openclaw/issues/60665) by forwarding per-group `systemPrompt` config into inbound `GroupSystemPrompt` context on every turn.

In practice this means BlueBubbles users can configure **different behavioral instructions per chat group** — for example, different reply styles for a family group versus a work team — with wildcard `"*"` support as a fallback for groups not explicitly named. The config follows the existing `requireMention` pattern so it should feel natural for anyone already using per-channel settings.

## Agents/Compaction Notices

PR [#67830](https://github.com/openclaw/openclaw/pull/67830) from [@feniix](https://github.com/feniix) adds opt-in start and completion notices during context compaction. Long sessions that trigger background compaction now surface a visible signal rather than silently compacting mid-conversation. Useful for debugging and for users who want to understand when their context window is being managed.

## Plugin/Task Detached Runtime Contract

PR [#68915](https://github.com/openclaw/openclaw/pull/68915) from [@mbelinky](https://github.com/mbelinky) formalizes the extension point for plugin-owned task lifecycle. Plugins can now register as detached runtime owners — responsible for their own task cancellation and state transitions — without reaching into core task internals. This is the kind of boundary that makes third-party extensions more stable across releases.

## Performance: Log Sanitization

PR [#67205](https://github.com/openclaw/openclaw/pull/67205) from [@bulutmuf](https://github.com/bulutmuf) replaces the iterative character-stripping loop in `sanitizeForLog()` with a single regex pass. The functional behavior is unchanged, but high-volume deployments that log aggressively will see measurably lower overhead on the logging path.

## Getting This Release

```bash
npm install -g openclaw@latest
# or update an existing install
openclaw update
```

The full changelog is available at [github.com/openclaw/openclaw/releases/tag/v2026.4.20](https://github.com/openclaw/openclaw/releases/tag/v2026.4.20).
