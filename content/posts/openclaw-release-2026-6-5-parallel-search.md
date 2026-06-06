---
title: "OpenClaw 2026.6.5 — Parallel Search, MCP Fixes, SQLite Auth"
excerpt: "OpenClaw 2026.6.5 ships Parallel as a bundled web_search provider, fixes MCP tool result coercion errors, and moves auth profiles to SQLite."
coverImage: '/assets/images/posts/openclaw-release-2026-6-5-parallel-search.png'
date: '2026-06-06T08:00:00.000Z'
dateFormatted: June 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-release-2026-6-5-parallel-search.png'
---

OpenClaw shipped `2026.6.5` in the early hours of June 6th — a dense pre-release that touches search providers, MCP stability, Anthropic extended-thinking recovery, ClawHub skill installs, and auth durability. Here's what's in it.

## Parallel Is Now a Bundled Web Search Provider

The headline addition in this release is first-class support for [Parallel](https://parallel.ai) as a bundled `web_search` provider ([#85158](https://github.com/openclaw/openclaw/pull/85158), thanks [@NormallyGaussian](https://github.com/NormallyGaussian)).

Set `PARALLEL_API_KEY` in your environment and OpenClaw discovers it automatically. The implementation includes:

- Cache-safe session IDs so parallel searches don't collide across concurrent agents
- Guarded endpoint handling that fails cleanly on bad keys or rate limits
- Full onboarding picker support — you'll see Parallel offered during `openclaw onboard` if the key is present
- Docs coverage alongside the existing web search provider guide

This joins the existing Brave, Bing, and Kagi integrations as a first-class search option, with no plugin install required.

## MCP Tool Results No Longer Cause Anthropic 400s

A frustrating class of errors got fixed: MCP tools returning `resource_link`, `resource`, `audio`, malformed image blocks, or other non-text/image content at the materialize boundary were flowing into session history as-is, which caused Anthropic's API to reject the entire request with a 400 ([#90710](https://github.com/openclaw/openclaw/issues/90710), [#90728](https://github.com/openclaw/openclaw/pull/90728), thanks [@RanSHammer](https://github.com/RanSHammer) and [@849261680](https://github.com/849261680)).

The fix coerces richer MCP content at the boundary: valid images are preserved, audio and resource blocks are turned into descriptive text, and unknown block types are handled gracefully so they don't poison session history or break future turns.

If you've been running MCP-connected tools and hitting mysterious 400 errors, this release fixes it.

## Extended Thinking Survives Prompt-Cache Expiry and Gateway Restarts

Anthropic extended-thinking sessions were silently breaking when prompt cache expired or the Gateway restarted mid-session ([#90667](https://github.com/openclaw/openclaw/issues/90667), [#90697](https://github.com/openclaw/openclaw/pull/90697), thanks [@openperf](https://github.com/openperf)).

The root cause: stream start events weren't waiting for `message_start`, so pre-generation signature errors couldn't trigger the existing recovery retry path. The fix defers stream start event processing until `message_start` arrives, letting the retry logic kick in correctly after cache expiry or restart. Extended-thinking sessions should now resume cleanly instead of hanging or producing mangled output.

## ClawHub Skills Can Now Install from GitHub Repositories

Skills hosted in GitHub repositories can now be installed through the resolved ClawHub install API ([#90478](https://github.com/openclaw/openclaw/pull/90478), thanks [@Patrick-Erichsen](https://github.com/Patrick-Erichsen)). The install flow downloads the pinned GitHub commit, runs install-policy checks, and reports telemetry on success — the same flow used for registry-hosted skills.

This opens up a broader category of community skills that don't need to go through the full ClawHub publish flow before they're installable via `clawhub install`.

## Auth Profiles Move to SQLite

Auth profiles now live in SQLite instead of flat files ([#89102](https://github.com/openclaw/openclaw/pull/89102)). Official npm plugin install records also keep their trusted pins through the new store, and prerelease fallback integrity checks no longer carry stale integrity forward from previous installs.

The practical effect: Gateway restarts are less likely to lose auth state, and plugin install records are more durable across updates.

## macOS Node Mode Stability Fix

macOS node mode was silently self-reconnecting away from a healthy direct Gateway session, causing unexpected companion app session churn ([#90668](https://github.com/openclaw/openclaw/issues/90668), [#90815](https://github.com/openclaw/openclaw/pull/90815), thanks [@vrurg](https://github.com/vrurg)). The fix keeps the node on its established direct Gateway session instead of re-probing and switching unnecessarily.

## Other Notable Fixes

- **QQBot** now strips model reasoning/thinking scaffolding before delivery, so internal chain-of-thought narration doesn't leak into channel replies ([#89913](https://github.com/openclaw/openclaw/issues/89913))
- **Google Vertex ADC** users get static catalog rows and runtime model resolution back after a regression ([#90609](https://github.com/openclaw/openclaw/pull/90609), [#90816](https://github.com/openclaw/openclaw/pull/90816))
- **Matrix** can now preflight voice notes before mention gating and correctly preserves thread reads/replies through Matrix relations pagination ([#90415](https://github.com/openclaw/openclaw/pull/90415))
- **Cron legacy JSON stores** migrate to SQLite during `openclaw doctor` preflight, preventing runtime read failures after upgrade ([#90208](https://github.com/openclaw/openclaw/pull/90208))
- **Service env placeholders** no longer mask state-dir secrets, fixing a subtle config-override issue ([#90488](https://github.com/openclaw/openclaw/pull/90488))

## How to Update

```bash
npm install -g openclaw@latest
```

Full release notes and verification hashes are on the [GitHub releases page](https://github.com/openclaw/openclaw/releases/tag/v2026.6.5).
