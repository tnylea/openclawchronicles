---
title: "OpenClaw v2026.5.12: Per-Sender Tool Policies Land Tonight"
excerpt: "OpenClaw v2026.5.12-beta.2 ships per-sender tool policies, Codex auth-profile media fixes, and more resilient provider streams."
coverImage: '/assets/images/posts/openclaw-2026-5-12-per-sender-tool-policies.png'
date: '2026-05-12T23:00:00.000Z'
dateFormatted: May 12th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-12-per-sender-tool-policies.png'
---

OpenClaw shipped two pre-releases today — **v2026.5.12-beta.1** at 17:10 UTC and **v2026.5.12-beta.2** at 22:15 UTC — carrying a focused batch of operator-grade improvements that round out an active week of beta work.

## Per-Sender Tool Policies (PR #66933)

The headline change is a new **per-sender tool policies** system. Operators can now restrict dangerous tools by requester identity across global, agent, group, core, bundled, and plugin tool surfaces.

Until today, tool permissions were scoped to agents and channels. This PR — contributed by [@JerranC](https://github.com/JerranC) — adds a finer-grained layer: **canonical channel-scoped sender keys**. The practical effect is that you can now say "User A can invoke the `exec` tool, but User B cannot" without creating separate agents or restructuring your channel setup.

This matters most for multi-user deployments where a shared agent handles messages from people with different trust levels — public-facing bots, family installations, and team deployments all benefit. Combined with the per-agent `tools.message.crossContext` and `tools.message.actions.allow` overrides that landed in the beta.5 cycle, OpenClaw now has a three-level tool permission hierarchy: global policy → agent policy → sender policy.

## Codex Auth-Profile Media Tools Fixed

A regression silently affecting Codex users is resolved. When OpenAI auth lives in the agent's **auth-profile store** rather than environment variables, media tools like `image_generate` were being dropped from the available toolset.

The fix ensures auth-profile-backed media tools remain accessible in Codex harness sessions regardless of where the OpenAI credentials are stored. If you've been wondering why your Codex agent stopped generating images after migrating to auth profiles, this is the update to grab.

## ACP Session Lineage Now Exposed (PR #73458)

[@samzong](https://github.com/samzong) landed a change that exposes Gateway session lineage metadata through ACP session listings and session info snapshots. ACP clients can now render **subagent graphs** — full parent-child session trees — without needing private Gateway side channels.

This is a building block for richer orchestration UIs. Tools like [Clawcenter](https://github.com/borjasolerme/Clawcenter) and other mission control panels can now show complete agent lineage without privileged access to internal Gateway state.

## Provider Stream Resilience (PR #80927)

OpenAI-compatible SSE and JSON fallback streams now drain correctly across split chunks. Azure Responses streams also get a bounded first-event diagnostic instead of stalling indefinitely. Contributed by [@galiniliev](https://github.com/galiniliev) and [@CaptainTimon](https://github.com/CaptainTimon), this fixes a class of silent failures when provider responses arrive in fragmented chunks — a common occurrence on high-latency or rate-limited connections.

## Auto-Reply Error Surfacing (PR #80917)

A quality-of-life fix from [@dutifulbob](https://github.com/dutifulbob): when a configured model backend fails and the fallback produces no visible reply, OpenClaw now surfaces a visible error instead of silently doing nothing. Intentional silent turns and side-effect-only deliveries are preserved — this only fires when there's a genuine failure the user should know about.

## Gemini 3 Pro Preview ID Normalization

Three coordinated changes consolidate the handling of retired Gemini 3 Pro Preview model IDs. Regardless of how your Gemini auth is configured — SDK OAuth auth flows, direct `openclaw models auth login --set-default`, or API-key onboarding — config now consistently targets `google/gemini-3.1-pro-preview`. Worth knowing if you've been manually patching model IDs after auth flows.

## iMessage: BlueBubbles-to-imsg Cutover Path (PR #80706)

[@omarshahine](https://github.com/omarshahine) added `openclaw channels status --channel` filtering and documented the **BlueBubbles-to-imsg cutover path**, so operators can probe the iMessage channel status without needing to start both channel monitors simultaneously. A small but welcome quality-of-life improvement for anyone running iMessage as a channel.

## Runtime/Fly Machine Detection (PR #80209)

Fly Machines are now detected as container environments from their runtime env vars, so `gateway bind` and Bonjour defaults correctly match remote container launches. [@liorb-mountapps](https://github.com/liorb-mountapps) contributed this fix, which resolves a class of gateway configuration drift when deploying to Fly.io.

## What to Upgrade

[v2026.5.12-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.5.12-beta.2) is a pre-release. If you're running the beta channel, the per-sender tool policies and provider stream resilience improvements are the strongest reasons to update today. The next stable release will graduate these changes for everyone.
