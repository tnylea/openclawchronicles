---
title: "OpenClaw Fixes Token Usage Reporting for Local AI Backends"
excerpt: "A new OpenClaw beta ensures stream_options.include_usage is always sent, so Ollama, LM Studio, and custom OpenAI-compatible backends finally report real context usage."
coverImage: '/assets/images/posts/openclaw-2026-4-19-usage-reporting-local-backends.webp'
date: '2026-04-19T08:05:00.000Z'
dateFormatted: April 19th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-19-usage-reporting-local-backends.webp'
---

One of the most common complaints from users running OpenClaw against local models — Ollama, LM Studio, vLLM, or any other OpenAI-compatible backend — has been broken token usage reporting. Context percentages showed as 0% in `/status`, and compaction logic couldn't make accurate decisions about when to summarize. A fix landed this morning in [v2026.4.19-beta.2](https://github.com/openclaw/openclaw/releases).

## What Was Broken

When OpenClaw makes a streaming completion request, it relies on the usage data returned at the end of the stream to track how many tokens are in the active context window. OpenAI's own infrastructure sends this automatically, but many local and custom OpenAI-compatible backends only include usage data when explicitly asked via `stream_options.include_usage: true` in the request payload.

OpenClaw wasn't consistently sending this flag for all streaming requests. The result: backends that require the explicit ask would silently return no usage data, and the agent would show 0% context utilization — even when the context was nearly full. Worse, the compaction engine (which decides when to summarize long sessions) was flying blind on usage, potentially missing when a context window was filling up.

## The Fix

[PR #68746](https://github.com/openclaw/openclaw/pull/68746) (thanks [@kagura-agent](https://github.com/kagura-agent)) ensures `stream_options.include_usage` is always sent on streaming requests in the OpenAI-completions agent path. This is the transport path used by Ollama, LM Studio, OpenRouter, and any other server that speaks the OpenAI Chat Completions API.

The fix is unconditional on the streaming path — it doesn't try to guess whether your backend needs the flag. This means:

- **Ollama users**: context usage will now appear correctly in `/status` after updating
- **LM Studio / vLLM / LocalAI users**: same benefit — real token counts, not zeros
- **OpenRouter users**: already worked for most models, but edge cases involving older proxy layers should now be covered
- **Compaction**: the engine can now make accurate decisions about when to compact, reducing the risk of silent context overflow on long sessions with local models

## Companion Fix for Status Persistence

A related fix also in beta.2 ([#67695](https://github.com/openclaw/openclaw/pull/67695)) handles a different but complementary edge case: providers that return usage data on *most* replies but omit it on some (for example, certain tool-use responses or mid-stream partial chunks). Previously this would cause the displayed context percentage to drop back to 0% or "unknown" whenever a usage-omitting response came through.

The fix carries the last known token total forward in these cases, so `/status` shows a stable, non-flickering context percentage even across heterogeneous response streams.

## Who Should Update

If you run OpenClaw against any local model backend or custom OpenAI-compatible endpoint and have ever seen 0% context usage in `/status`, this beta is worth testing:

```bash
npm install -g openclaw@beta
```

For users on the stable channel, this fix will land in the next stable release. Watch the [releases page](https://github.com/openclaw/openclaw/releases) for the stable tag.

## Why This Matters Beyond the UI

The token usage display in `/status` isn't just cosmetic — it feeds into OpenClaw's automatic context management. Accurate usage numbers mean the agent knows when to compact, when to warn about approaching limits, and when to trigger model failover due to context pressure. Getting this right for local backends is especially important since those models often have smaller context windows than cloud providers, making accurate tracking even more critical.
