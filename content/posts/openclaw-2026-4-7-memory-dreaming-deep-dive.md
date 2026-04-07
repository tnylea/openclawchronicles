---
title: "OpenClaw Memory Dreaming: How Your Agent Builds Long-Term Memory"
excerpt: "OpenClaw's experimental Dreaming system promotes short-term notes into lasting memory through three cooperative phases. Here is how it works and how to enable it."
coverImage: '/assets/images/posts/openclaw-2026-4-7-memory-dreaming-deep-dive.png'
date: '2026-04-07T08:05:00.000Z'
dateFormatted: April 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-7-memory-dreaming-deep-dive.png'
---

One of the most ambitious features in the [OpenClaw v2026.4.5 release](https://github.com/openclaw/openclaw/releases/tag/v2026.4.5) is Memory Dreaming — an experimental system that gives your agent a way to consolidate short-term daily notes into durable long-term memory, automatically, in the background. It is inspired by how human sleep cycles process and retain information, and it is more capable than it might first appear.

## The Problem Dreaming Solves

OpenClaw agents are stateless by default — they wake up fresh each session. The workaround has always been files: write things to `MEMORY.md`, keep daily notes in `memory/YYYY-MM-DD.md`, and read them at the start of each session. This works, but it is manual. Important context gets buried in verbose daily logs. Outdated facts stay in `MEMORY.md` forever. Agents have to decide for themselves what is worth preserving.

Dreaming automates the curation step. The system reads through daily notes, stages noteworthy content for review, and promotes the most durable insights into long-term memory — without the agent needing to do it manually on every heartbeat.

## Three Cooperative Phases

Earlier builds of Dreaming experimented with competing modes. The v2026.4.5 release refactored this into three cooperative phases that run independently on their own schedules:

**Light sleep** — The most frequent phase. Scans recent daily notes, groups nearby lines into coherent chunks (avoiding generic date headings), and stages them as candidates for deeper review. Think of it as the agent briefly skimming its recent journal before bed.

**Deep sleep** — Less frequent, more deliberate. Applies weighted short-term recall promotion, surfacing content that appeared multiple times or seems contextually important. Reruns are replay-safe — they reconcile with existing `MEMORY.md` entries rather than duplicating them.

**REM** — The rarest and most powerful phase. Surfaces *possible lasting truths* from staged content, writes a dreams trail to `dreams.md` (kept separate from daily notes to avoid cluttering default recall), and exposes preview tooling for operators who want to inspect what the agent is about to promote. REM is where raw observations become durable beliefs.

## What Gets Written Where

The Dreaming system writes to two places:

- **`MEMORY.md`** — Promoted long-term memories. The canonical store for things worth keeping across many sessions. Dreaming adds to this carefully, using reconciliation to avoid redundancy.
- **`dreams.md`** — A trail of everything the Dreaming system has processed, including staging decisions and REM outputs. This is readable but not automatically pulled into default recall — it is diagnostic, not operational.

A Dream Diary UI surface in the Control UI shows a readable view of `dreams.md` with the Lobster animation visible above the diary content. It is surprisingly pleasant to browse.

## Configuring Dreaming

Dreaming is experimental and opt-in. The configuration has been deliberately simplified in v2026.4.5 — earlier builds exposed all three phases as user-facing knobs, but that was confusing. The current surface is just two fields:

```yaml
memory:
  dreaming:
    enabled: true
    frequency: normal   # light | normal | aggressive
```

Setting `enabled: true` activates all three phases on their default schedules. The `frequency` setting shifts the timing without exposing individual phase controls. Operators who need fine-grained tuning can still adjust `recencyHalfLifeDays` and `maxAgeDays` to control how quickly older memories decay.

## Inspecting and Debugging

The release ships several operator tools for working with Dreaming:

- **`/dreaming`** — Chat command that shows current Dreaming status, recent activity, and a link to the Dream Diary.
- **`openclaw memory rem-harness`** — CLI tool for manually triggering a REM run and inspecting what would be promoted.
- **`openclaw memory promote-explain`** — Explains *why* specific content was or was not promoted during REM staging.
- **`openclaw doctor`** — Detects and repairs broken Dreaming state. Status and repair support were added alongside the main feature.

## Is It Ready to Use?

Dreaming is marked experimental for good reason. The promotion logic is heuristic, and the results vary depending on how verbose your daily notes are and how consistent your session patterns are. For agents that write rich daily logs, Dreaming does a genuinely impressive job of surfacing what matters. For minimalist setups, the signal-to-noise ratio is lower.

The replay-safety work in this release is significant though — earlier versions could duplicate `MEMORY.md` entries on restart, which made Dreaming risky to enable in production. That is now fixed, and reindexing is handled cleanly.

If you have been managing `MEMORY.md` by hand and finding it tedious, Dreaming is worth enabling in a test deployment. The worst case is that it surfaces some noise in `dreams.md` — it will not corrupt your existing memory without your review.

See the full [v2026.4.5 changelog](https://github.com/openclaw/openclaw/releases/tag/v2026.4.5) for the complete set of Dreaming changes, including contributions from [@vignesh07](https://github.com/vignesh07), [@davemorin](https://github.com/davemorin), and [@mbelinky](https://github.com/mbelinky).
