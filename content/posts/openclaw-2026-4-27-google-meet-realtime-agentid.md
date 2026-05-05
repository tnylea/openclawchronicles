---
title: "OpenClaw Google Meet Realtime Consult Now Routes to Specific Agents"
excerpt: "OpenClaw now supports per-agent routing in Google Meet realtime consult sessions, letting you direct live meeting queries to a specific configured agent."
coverImage: '/assets/images/posts/openclaw-2026-4-27-google-meet-realtime-agentid.png'
date: '2026-04-27T08:05:00.000Z'
dateFormatted: April 27th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-27-google-meet-realtime-agentid.png'
---

## Agent-Aware Meetings

OpenClaw's Google Meet integration got a targeted upgrade today. [PR #72381](https://github.com/openclaw/openclaw/pull/72381), merged by BsnizND and reviewed by steipete, adds `agentId` support to the Google Meet realtime consult feature.

Previously, realtime consult sessions in Google Meet would use your default configured agent. Now you can specify exactly which agent handles meeting queries — useful when you have separate agents set up for different domains (a research agent, a coding agent, a writing assistant) and want meeting context routed to the right one.

## What Is Google Meet Realtime Consult?

OpenClaw's Google Meet realtime consult feature lets you get live AI assistance during a call without leaving the meeting. It connects your active Meet session to your OpenClaw Gateway, letting you query your agent mid-meeting and receive responses inline.

The feature sits alongside OpenClaw's broader Google Meet tooling — calendar-backed attendance exports, meeting records, and dry-run previews — which was significantly expanded in the recent `v2026.4.25` pre-release cycle.

## How to Configure It

With `agentId` support, you can now pin realtime consult sessions to a specific agent. In your `openclaw.json`:

```json
{
  "channels": {
    "googleMeet": {
      "realtimeConsult": {
        "agentId": "your-research-agent"
      }
    }
  }
}
```

When a realtime consult session starts, queries are routed to the specified agent rather than falling through to the default. No code changes required — just a config update.

## Why Multi-Agent Routing Matters Here

Multi-agent setups are increasingly common in OpenClaw. Different channels — WhatsApp, Discord, Slack, Google Meet — often call for different agent personalities, system prompts, and toolsets. Being able to bind each surface to the right agent gives you precise control over how your AI assistant behaves in context.

Google Meet is a real-time, conversational surface. Having a dedicated agent for it — one tuned for meeting support, summarization, or domain-specific Q&A — makes more sense than sharing an agent across all your channels.

## What to Expect Next

This PR merged alongside a broader batch of Google Meet improvements in the `v2026.4.25` cycle, including calendar-backed attendance export and meeting record tooling. OpenClaw's Meet integration appears to be getting steady attention, so expect further refinements in upcoming releases.

**Source:** [PR #72381 on GitHub](https://github.com/openclaw/openclaw/pull/72381)
