---
title: "OpenClaw beta.4 and beta.5: Agent Sandboxing and Fly.io Detection Land"
excerpt: "OpenClaw drops two rapid-fire beta releases today with per-agent message sandboxing, Fly.io auto-detection, expanded agent-to-agent turn limits, and Fal edit mode upgrades."
coverImage: '/assets/images/posts/openclaw-2026-5-11-beta4-beta5-release.webp'
date: '2026-05-11T23:00:00.000Z'
dateFormatted: May 11th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-11-beta4-beta5-release.webp'
---

Hot on the heels of this morning's beta.3 release, the OpenClaw team shipped two more rapid-fire updates today: **beta.4** and **beta.5**. Together they bring meaningful improvements to agent sandboxing, multi-agent workflows, cloud deployment detection, image editing, and a handful of stability fixes that have been frustrating power users. Here's everything you need to know.

## Per-Agent Message Sandboxing

The headline feature of beta.4 is granular control over what messages an agent can send and to whom.

Two new agent config options give operators fine-grained control: `tools.message.crossContext` overrides restrict outbound message sends to the current conversation only, and `tools.message.actions.allow` lets you expose send-only message tools on a per-agent basis. Together, they close a real security gap for anyone running public-facing or untrusted agents.

Before this change, any agent with message access could theoretically DM arbitrary users. That's a non-starter for multi-tenant deployments or community bots. Now you can lock agents down to their own conversation context without disabling messaging entirely.

## Agent-to-Agent Turn Limits Expanded

Complex multi-agent workflows have long bumped into a frustrating ceiling: the default five-turn ping-pong limit between agents. Beta.4 extends the `session.agentToAgent.maxPingPongTurns` cap to 20 (the default remains at 5 to keep things safe for casual use).

This fixes issue #52382, contributed by @thirumaleshp. If you're running orchestration patterns where one agent delegates to another and back across multiple reasoning steps, you'll feel this immediately.

## Fly.io Machine Auto-Detection

Deploying OpenClaw on Fly.io required a handful of manual config tweaks to get the gateway bind address and Bonjour/mDNS defaults right for remote container environments. Beta.4 handles this automatically.

OpenClaw now detects Fly Machines via runtime environment variables (PR #80209, credit @liorb-mountapps) and adjusts relevant defaults without any user intervention. Less friction for one of the more popular cloud deployment targets in the community.

## Fal Provider: GPT Image 2 and Nano Banana 2 Edit Improvements

Image editing via the Fal provider gets a significant upgrade in beta.4, fixing issue #77295 (credit @leoge007).

Reference-image edit requests now route to the `/edit` endpoint with an `image_urls` array, correcting a routing bug that caused edits to silently fall back to generation. Nano Banana 2 edit geometry now uses the correct `aspect_ratio` and `resolution` parameters. Input-image caps have been raised to 10 for GPT Image 2 and 14 for NB2. Aspect-ratio hints are also now permitted in edit mode, giving you more compositional control.

## Control UI Recovery Panel

A persistent blank-dashboard bug (issue #44107, credit @BunsDev) has plagued users whose browser extensions interfere with the app module registration. Beta.4 adds a plain HTML recovery panel that appears when the app module fails to load. It provides a retry path and a direct link to the browser-extension troubleshooting guide — meaning you no longer need to know where to look in the docs to unblock yourself.

## Codex Timeout Fix

When an app-server client times out during a bounded turn interrupt, OpenClaw now properly retires that client. Previously, Discord agents could reuse a CPU-spinning Codex process after a timeout, causing silent hangs that were extremely difficult to diagnose. This fix cleans up the process lifecycle correctly.

## beta.5: Bonjour/mDNS Watchdog Fix

Beta.5 dropped shortly after beta.4, addressing a mDNS re-advertise loop on Windows, WSL, and multicast-hostile hosts (PR #74778, @fuller-stack-dev).

Active ciao probing and name-conflict renames are now correctly treated as in-progress operations, so the mDNS watchdog waits before retrying instead of hammering the network with rapid re-advertise attempts. A small but impactful fix for anyone running OpenClaw on Windows or in containerized environments.

## beta.5: MiniMax M2.7 Empty Content Fix

Tool-heavy sessions with MiniMax M2.7 could result in an error: `chat content is empty`. This happened when message conversion filtered a turn down to nothing, leaving M2.7 with no user turn to respond to. Beta.5 sends a minimal Anthropic-compatible user fallback in that case, fixing issue #74589.

## beta.5: Cron Long-Run Fix

Long manual cron runs were occasionally losing their active marker in the task registry before completion, causing confusing transient states where a running job appeared to have disappeared. Beta.5 keeps those tasks active in the registry until they fully complete, fixing issue #78233 (credit @Feelw00).

---

Both beta.4 and beta.5 are available now. See the full changelogs on the [GitHub releases page](https://github.com/openclaw/openclaw/releases).
