---
title: "OpenClaw Responses Compaction Gets a Safer Fix"
excerpt: "OpenClaw PR #130993 fixes Responses compaction pressure, staged timeouts, and retention checks so long agent sessions compact at the right boundary."
coverImage: '/assets/images/posts/openclaw-2026-8-30-responses-compaction-context-limit.png'
date: '2026-08-30T08:03:00.000Z'
dateFormatted: August 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-30-responses-compaction-context-limit.png'
---

OpenClaw merged [PR #130993](https://github.com/openclaw/openclaw/pull/130993) this morning with a large repair to the long-session compaction path for OpenAI Responses-backed agents. The short version: sessions should stop compacting too early, stop timing out healthy staged compactions, and stop rejecting summaries because a finished assistant response was mistaken for a finished user task.

That is dense infrastructure work, but it matters to anyone who keeps an OpenClaw agent alive across large transcripts, repeated tool calls, or long operational workflows. Compaction is the system that decides when old context should be summarized so the model can keep working inside its context window. If that boundary is wrong, the agent can lose useful detail, spend extra time summarizing, or fail a turn that should have continued.

## What Changed

The PR describes six failures in the same long-session compaction pipeline. The most visible one was context pressure. OpenAI Responses terminal usage included the token accounting OpenClaw needed, but the mapper did not project the provider's coherent input and total snapshot into the runtime's `contextUsage` field. OpenClaw then fell back to estimating the mirrored transcript and could double-count provider-owned context.

The PR's sanitized replay shows the difference clearly: before the fix, the pressure owner chose `compact_then_truncate` with an estimated prompt of 390,486 tokens against a 252,000-token budget. After the fix, it used the provider snapshot and routed the same session as fitting, with an estimated prompt of 198,202 tokens.

The patch also changes watchdog ownership for native staged compaction. The PR says OpenClaw's built-in split compaction can involve multiple serial model requests: chunks are summarized, then merged. A single outer 180-second deadline could consume most of its budget on the first request, then abort a later request even though each request was making progress. The repair makes watchdog ownership an explicit runtime capability that survives registry projection proxies, while custom and plugin compaction still keep their host-level deadline.

## Why The Retention Fix Matters

The other big repair is semantic. OpenClaw's quality gate had treated an assistant response with `stopReason="stop"` as evidence that the user's latest task was complete. But `stop` means the assistant response ended normally; it does not prove the work was finished.

That distinction matters during compaction. A correct summary might preserve unfinished work under a "pending user asks" section, then get rejected because the audit incorrectly believed the same work should be marked complete. PR #130993 removes that invalid completion signal from compaction preparation, retention, and quality auditing.

The later follow-up section in the PR closes another loop: when the latest request itself was missing from a generated summary, the retention owner could skip the deterministic repair path that was supposed to restore it. The fix now treats missing latest-request overlap as a reason to rebuild the structured body, using bounded source context when it can fit.

## Proof And Operator Impact

The PR includes focused regression evidence across context-engine, timeout, safeguard, and agent-core compaction tests, plus live deployment proof from a maintainer gateway. The live proof cited seven automatic compactions on the exact repaired head with seven successes and zero failures, following about 30 successes on a prior deployed head in the same repair line.

For operators, the practical impact is straightforward:

- Responses sessions should compact based on provider usage instead of inflated replay estimates.
- Prompt-only recovery should avoid mutating provider-owned transcript rows.
- Built-in split compaction gets a per-request progress window instead of one brittle aggregate deadline.
- Summaries should retain unfinished latest requests more reliably.
- Plugin-owned and custom compaction engines remain bounded by the existing host deadline.

This is not a release announcement yet; it is a merged PR on main. But given the P1 label and the amount of proof attached, it is one of the more important OpenClaw reliability fixes in today's morning window.
