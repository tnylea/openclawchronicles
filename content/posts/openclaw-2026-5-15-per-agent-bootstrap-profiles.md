---
title: "OpenClaw Adds Per-Agent Bootstrap Profiles for Precise Context Control"
excerpt: "OpenClaw now lets you configure contextInjection and bootstrap size limits per individual agent, giving multi-agent setups precise control over startup context."
coverImage: '/assets/images/posts/openclaw-2026-5-15-per-agent-bootstrap-profiles.png'
date: '2026-05-15T08:00:00.000Z'
dateFormatted: May 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-15-per-agent-bootstrap-profiles.png'
---

If you run OpenClaw with multiple agents, you've probably hit the same frustration: one config to rule them all. A coding agent that needs deep workspace context and a lightweight triage bot that should stay lean have been forced to share the same `agents.defaults` bootstrap settings — until now.

A new PR merged today ([#82036](https://github.com/openclaw/openclaw/pull/82036), by [@BunsDev](https://github.com/BunsDev)) introduces **per-agent bootstrap profiles**, letting you override context injection behavior and bootstrap size limits at the individual agent level.

## What Changed

Three new optional fields are now available inside each `agents.list[]` entry in your OpenClaw config:

- **`contextInjection`** — controls which context files are injected at bootstrap for this specific agent
- **`bootstrapMaxChars`** — caps the character budget for a single bootstrapped file for this agent
- **`bootstrapTotalMaxChars`** — caps the total bootstrap context size across all files for this agent

When any of these is set on an agent entry, it takes precedence over the corresponding value in `agents.defaults`. If unset, the defaults apply as before — fully backward compatible.

## Why It Matters

Multi-agent setups often have wildly different needs. Consider a typical homelab setup with two agents:

- **A coding agent** that needs your full AGENTS.md, SOUL.md, USER.md, recent memory files, and a generous bootstrap budget to do useful work
- **A triage/heartbeat agent** that should spin up fast with minimal context, process a lightweight check, and get out

Before today, both agents shared the same bootstrap profile. You could either over-provision the lightweight agent (wasting tokens on every heartbeat run) or under-provision the coding agent (losing important workspace context). Now you can tune each independently.

## How to Configure It

Here's an example `openclaw.json` showing per-agent overrides alongside your defaults:

```json
{
  "agents": {
    "defaults": {
      "bootstrapMaxChars": 40000,
      "bootstrapTotalMaxChars": 120000
    },
    "list": [
      {
        "id": "main",
        "contextInjection": {
          "files": ["SOUL.md", "USER.md", "AGENTS.md", "MEMORY.md"]
        },
        "bootstrapMaxChars": 60000,
        "bootstrapTotalMaxChars": 200000
      },
      {
        "id": "triage",
        "contextInjection": {
          "files": []
        },
        "bootstrapMaxChars": 8000,
        "bootstrapTotalMaxChars": 20000
      }
    ]
  }
}
```

The `triage` agent above starts with zero injected files and tight size limits — perfect for a cron-driven heartbeat that doesn't need your full workspace identity loaded.

## Improved Diagnostics

The PR also threads the resolved session agent ID through the `/context` diagnostic output, so when you run `/context` in a session, the report now accurately reflects the bootstrap profile actually applied to that agent — not just the global defaults. This makes it much easier to verify your per-agent settings are working as expected.

## Under the Hood

The implementation adds the three fields to `AgentEntrySchema` in `src/config/zod-schema.agent-runtime.ts`, updates the central bootstrap file resolver and bootstrap limit resolver to check per-agent overrides before falling back to defaults, and passes the resolved agent ID through embedded, compact, CLI, and diagnostic code paths. Focused regression tests cover the resolver logic and the `/context` report for session-agent bootstrap limits.

No existing behavior changes if you don't add these fields — your current config works as-is.

## What to Expect Next

This lands in a future `v2026.5.x` stable build. If you're tracking the beta channel, it should appear in the next beta tag cut after the PR clears CI and maintainer review. Keep an eye on the [GitHub releases page](https://github.com/openclaw/openclaw/releases) for the tag that includes PR #82036.

Per-agent bootstrap profiles are a quiet but meaningful unlock for anyone running more than one agent — and given how common split coding/utility setups have become, this one's been a long time coming.

---

*Source: [PR #82036 — support per-agent bootstrap profiles](https://github.com/openclaw/openclaw/pull/82036) by [@BunsDev](https://github.com/BunsDev)*
