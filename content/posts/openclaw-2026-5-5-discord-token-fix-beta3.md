---
title: "OpenClaw 2026.5.4-beta.3 Fixes Silent Discord Token Bug"
excerpt: "OpenClaw 2026.5.4-beta.3 patches a silent Discord token failure introduced in 2026.5.3, adds a new models auth list command, and ships gateway startup speedups."
coverImage: '/assets/images/posts/openclaw-2026-5-5-discord-token-fix-beta3.webp'
date: '2026-05-05T08:00:00.000Z'
dateFormatted: May 5th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-5-discord-token-fix-beta3.webp'
---

Two fresh builds of OpenClaw v2026.5.4 landed in the early hours of May 5th. Beta.3, pushed at 6:14 AM UTC, is the one to pay attention to — it includes a critical fix for Discord users who upgraded to 2026.5.3 and found their channel quietly stopped working.

## The Silent Discord Token Failure

If you upgraded to OpenClaw 2026.5.3 and configured Discord via an environment variable (`channels.discord.token`), there is a good chance your channel silently failed to start. Beta.3 patches the root cause.

When OpenClaw 2026.5.2 externalized the Discord plugin into a standalone npm package (`@openclaw/discord`), its compiled artifacts moved into a `/dist/` directory. The secret-contract loader that reads per-channel `SecretRef` contracts — including the Discord token — only checked the package root, missing anything inside `/dist/`. The result: the Discord token SecretRef never resolved at gateway start, leaving the channel unconfigured with no obvious error message.

Beta.3 adds a `/dist/` lookup pass to the external-contract loader so env-backed Discord tokens resolve correctly on startup again.

**If your Discord channel stopped working after upgrading to 2026.5.3, update to the beta channel and confirm the channel comes back up.** This fix will also ship in the next stable release.

## New: `openclaw models auth list`

Beta.3 adds a long-requested quality-of-life command: `openclaw models auth list`. You can now inspect saved per-agent authentication profiles directly from the CLI, without dumping raw secrets or hitting the old "too many arguments" error.

```bash
# List all saved auth profiles
openclaw models auth list

# Filter to a specific provider
openclaw models auth list --provider openai

# Machine-readable output
openclaw models auth list --json
```

This is particularly useful when managing multiple agents with different provider credentials, or when debugging why an agent is picking up the wrong auth profile.

## Gateway Startup Gets Faster

The 2026.5.4 beta cycle has brought a sustained focus on gateway startup performance, and beta.3 continues that work with several targeted improvements:

- **Lazy plugin loading:** Bundled plugin metadata now uses a fast path for trusted packages, avoiding repeated cold metadata scans on startup
- **Deferred sidecars:** Non-readiness sidecars start after the gateway's ready signal instead of before it, improving time-to-ready
- **No jiti on native paths:** Compiled plugin surfaces no longer pay the source-transform loader cost at startup unless a fallback is actually needed

Together, these changes reduce both startup time and memory pressure for the default Gateway configuration — especially noticeable on machines running multiple bundled plugins.

## OpenRouter Response Caching (Opt-In)

Users routing requests through OpenRouter can now opt into response caching. When enabled, OpenClaw sends OpenRouter's `X-OpenRouter-Cache`, `X-OpenRouter-Cache-TTL`, and `cache-clear` headers on verified OpenRouter routes. This can reduce costs and latency for repeated or similar queries.

Beta.3 also expands OpenClaw's app-attribution categories on OpenRouter routes to include coding, programming, writing, chat, and personal-agent usage — giving OpenRouter better routing metadata for OpenClaw workloads.

## Control UI Polish

The Control UI picks up several improvements across the beta.2 and beta.3 cycle:

- **Agent name in breadcrumbs:** The dashboard now shows the active agent name in header breadcrumbs across all non-chat views
- **Collapsible cron sidebar:** The "New Job" panel in the cron manager can now be collapsed, letting the jobs list reclaim screen space
- **Chat deduplication:** Consecutive duplicate messages (like repeated heartbeat acknowledgements) are collapsed into a single bubble with a count badge
- **Responsive chat layout:** Chat controls and the composer now adapt cleanly across phone, tablet, and desktop widths

## How to Update

To get these fixes and features today, switch to the beta release channel:

```bash
npm install -g openclaw@beta
```

Or wait for the next stable release, which will include all 2026.5.4 improvements once the beta cycle wraps.

Full changelogs for [beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.5.4-beta.2) and [beta.3](https://github.com/openclaw/openclaw/releases/tag/v2026.5.4-beta.3) are on GitHub.
