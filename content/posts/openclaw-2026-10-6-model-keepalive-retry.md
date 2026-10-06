---
title: "OpenClaw Retries Model Streams With Empty Keepalives"
excerpt: "OpenClaw now detects model streams that send only empty keepalive chunks and routes them into the normal timeout retry path."
coverImage: '/assets/images/posts/openclaw-2026-10-6-model-keepalive-retry.png'
date: '2026-10-06T08:10:00.000Z'
dateFormatted: October 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-6-model-keepalive-retry.png'
---

OpenClaw merged a P1 availability fix for OpenAI-compatible model streams that stay technically connected while making no useful model progress.

[PR #165983](https://github.com/openclaw/openclaw/pull/165983), "fix: retry model streams stalled behind empty keepalives," addresses a subtle failure mode: a provider can keep sending empty chunks, preventing the connection-liveness watchdog from firing, while the agent run never receives an answer.

## The Problem With Empty Progress

Streaming APIs often use keepalive chunks to prove a connection is still open. That is useful, but it is not the same thing as model progress.

Before this fix, an OpenAI-compatible stream could emit an initial role chunk and then continue sending empty `choices` or empty deltas until the outer agent run timed out. From the transport layer's perspective, the connection was alive. From the user's perspective, nothing was happening.

The PR describes the result plainly: stalled model requests could emit empty keepalive chunks until the whole agent run timed out without an answer.

## What OpenClaw Does Now

OpenClaw now keeps the existing connection-liveness watchdog and adds a separate model-progress deadline in the same ownership path.

Valid chunks still reset liveness. Actual progress is tracked separately. Nonempty content, hidden reasoning, tool-call fragments, finish reasons, and usage information all count as progress. Empty keepalives do not.

When a stream fails to make progress for twice the effective model idle window, OpenClaw classifies the condition as a timeout and routes it through the existing retry and fallback machinery. Local endpoints retain their existing opt-out, and there are no new settings or schema changes.

## Why This Is User-Facing

The visible win is straightforward: a run that would previously sit behind empty stream chunks can now recover through the retry path.

That is especially important for OpenAI-compatible providers, where implementation details vary. Some providers send empty events during long computation. Others may send them after a backend has effectively wedged. OpenClaw's new split between connection activity and model progress gives the runtime a way to keep the former without trusting it as the latter.

The PR notes an important boundary: providers that send only empty keepalives during legitimate long computation now need to produce progress within the longer progress window. The existing provider timeout controls the window.

## Evidence From the Merge

The PR includes a production-only negative control. The new tests were kept, but the five modified production files were replaced with previous mainline versions. All three defect regressions failed as intended, while sibling cases still passed. Restoring the candidate made all ten cases pass.

The author also included a real HTTP/SSE trace with a synthetic local server, the production completions client, the production watchdog, the failover classifier, and the retry controller. In the candidate trace, the watchdog classified the no-progress stream, the retry owner accepted it, and the second request returned an answer.

Additional coverage spans fake-clock composition tests for empty chunks, hidden reasoning with display disabled, normal content, tool and finish events, usage-only chunks, buffered legacy tool calls, composed signals, and the local opt-out. The PR also reports 194 unchanged tests across watchdog, signal-composition, provider, and transport files.

## Bottom Line

This is a clean reliability distinction: alive is not the same as useful. OpenClaw now treats empty keepalives as connection activity, not answer progress, which gives stalled model streams a path back into retry and fallback instead of leaving the user waiting on a silent run.
