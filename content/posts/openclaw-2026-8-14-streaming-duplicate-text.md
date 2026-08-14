---
title: "OpenClaw Stops Duplicate Streaming Text"
excerpt: "OpenClaw fixes a web UI transcript bug that could duplicate assistant text after standalone preamble segments."
coverImage: '/assets/images/posts/openclaw-2026-8-14-streaming-duplicate-text.png'
date: '2026-08-14T08:03:00.000Z'
dateFormatted: August 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-14-streaming-duplicate-text.png'
---

OpenClaw merged a high-priority web UI fix this morning in [PR #123515](https://github.com/openclaw/openclaw/pull/123515), titled "fix(ui): unkeyed preamble segments duplicate assistant text via the accumulated-prefix tracker." The user-visible bug was simple but annoying: streaming replies could duplicate earlier assistant text, and the duplicate text could persist into the final transcript.

For a chat-first agent system, transcript correctness is not cosmetic. Operators rely on the transcript as the record of what happened, what the agent said, and what context future turns will inherit.

## What Caused the Duplication

The PR describes the failing case as an itemId-less preamble segment followed by a cumulative stream snapshot. The accumulated-prefix tracker treated any itemId-less segment as cumulative run text. That let a standalone preamble become the baseline prefix.

When the next genuine cumulative snapshot arrived, it no longer matched the expected baseline. The trimming helper then returned the whole run text untrimmed, which meant earlier assistant text rendered a second time.

The PR notes that the behavior affected both live rendering and terminal materialization. In other words, this was not just a temporary streaming flicker. The duplicated text could become part of the saved conversation view.

## The Fix

OpenClaw now centralizes the rule in one `advanceAccumulatedStreamText` owner. Instead of allowing four separate inline call sites to advance the tracker with the same broken assumption, the helper only treats text as the new baseline when it extends the current baseline.

That makes the behavior resilient to different segment producers. The fix does not depend on every producer stamping the perfect marker fields. It enforces the continuity rule where prefix ownership actually lives.

The regression proof in the PR is concrete: a tool flush, followed by a standalone preamble, followed by the next cumulative snapshot should render only the new text after the tool, not replay the earlier preamble plus the new text.

## Why This Matters

Duplicated transcript text is more than a visual glitch. It can make an agent appear to repeat itself, obscure which statement was actually generated when, and pollute the materialized transcript that later UI recovery and context flows depend on.

This fix is especially relevant for richer OpenClaw turns that include commentary, preambles, tool flushes, and streamed assistant output. As the interface gets more structured, the renderer needs to distinguish standalone text from cumulative run snapshots without guessing.

## The Bottom Line

[PR #123515](https://github.com/openclaw/openclaw/pull/123515) tightens OpenClaw's streaming transcript logic so preamble segments no longer poison the accumulated-prefix tracker. The result is cleaner live chat rendering and a more trustworthy persisted transcript for future turns.
