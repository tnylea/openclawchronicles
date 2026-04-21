---
title: "OpenClaw Beta Fixes Nested Agent Session Blocking"
excerpt: "Two new OpenClaw beta releases land on April 19th, squashing a session head-of-line block in nested agent lanes and restoring token usage visibility."
coverImage: '/assets/images/posts/openclaw-2026-4-19-nested-agent-fix.png'
date: '2026-04-19T08:00:00.000Z'
dateFormatted: April 19th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-19-nested-agent-fix.png'
---

Two beta releases landed overnight for OpenClaw — [v2026.4.19-beta.1](https://github.com/openclaw/openclaw/releases) at 02:01 UTC and [v2026.4.19-beta.2](https://github.com/openclaw/openclaw/releases) at 05:55 UTC — delivering targeted fixes for anyone running multi-agent setups, local AI backends, or Codex-powered threads.

## The Big One: Nested Agent Lane Blocking

The headline fix in beta.2 addresses a frustrating head-of-line blocking bug in nested agent lanes. Previously, a long-running nested agent task on one session could block **unrelated sessions across the entire gateway** — meaning a slow background agent job on Session A would freeze agents on Sessions B and C until it finished.

The fix ([#67785](https://github.com/openclaw/openclaw/pull/67785), thanks [@stainlu](https://github.com/stainlu)) scopes nested agent work per target session. Each session now has its own nested lane budget, so a busy session no longer starves others. If you run multiple concurrent agents — or just have one slow Codex thread running while trying to chat normally — this should make a noticeable difference.

## Session Token Totals Preserved Across Providers

Also in beta.2: a fix ([#67695](https://github.com/openclaw/openclaw/pull/67695)) for providers that skip usage metadata on some responses. OpenClaw now carries forward the last known context usage instead of resetting to 0% or "unknown" — so `/status` and `openclaw sessions` keep showing meaningful token counts even when a provider omits usage in a specific reply.

## Cross-Agent Channel Account Routing

Beta.1 landed a fix ([#67508](https://github.com/openclaw/openclaw/pull/67508), thanks [@lukeboyett](https://github.com/lukeboyett) and [@gumadeiras](https://github.com/gumadeiras)) for cross-agent subagent spawns in shared rooms and multi-account setups. Child sessions were inheriting the caller's channel account rather than using the target agent's bound account — leading to messages being sent from the wrong account in shared workspaces or Discord servers with multiple bot accounts.

The fix routes cross-agent subagent spawns through the target agent's bound channel account, while still preserving peer and workspace/role-scoped bindings. Multi-account Discord or Slack setups should see cleaner message attribution after this lands in stable.

## Codex Context Inflation Fix

Codex users will appreciate the fix in beta.1 ([#64669](https://github.com/openclaw/openclaw/pull/64669), thanks [@cyrusaf](https://github.com/cyrusaf)): cumulative app-server token totals were being misread as fresh per-turn context usage, causing `/status` to report wildly inflated context percentages in long Codex threads. The session now correctly measures only what's in the active context window.

## Telegram and Browser/CDP Improvements

Rounding out beta.1:

- **Telegram/callbacks** ([#68588](https://github.com/openclaw/openclaw/pull/68588)): Stale pagination buttons on Telegram commands no longer wedge the update watermark, blocking newer updates from landing.
- **Browser/CDP** ([#68207](https://github.com/openclaw/openclaw/pull/68207)): WSL-to-Windows Chrome endpoints no longer appear offline under strict SSRF defaults. Phase-specific diagnostics also now surface exactly which part of the CDP handshake failed.

## Trying the Betas

To opt into the beta channel:

```bash
npm install -g openclaw@beta
```

These are pre-releases — run them on a staging gateway or secondary install if you're cautious. The fixes target real production pain points, but stable users should wait for the next tagged release.

Both betas are available now on the [OpenClaw GitHub releases page](https://github.com/openclaw/openclaw/releases).
