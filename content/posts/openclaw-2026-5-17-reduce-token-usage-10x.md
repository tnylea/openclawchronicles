---
title: "How to Cut OpenClaw Token Usage by 10x with Compaction Config"
excerpt: "One developer dropped their daily token total from 2.2M to 256k by tuning compaction settings and eliminating silent heartbeat and cron duplication."
coverImage: '/assets/images/posts/openclaw-2026-5-17-reduce-token-usage-10x.webp'
date: '2026-05-17T23:05:00.000Z'
dateFormatted: May 17th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-17-reduce-token-usage-10x.webp'
---

A detailed post on [brtkwr.com](https://brtkwr.com/posts/2026-05-17-reducing-openclaw-token-usage/) published today describes how one developer reduced their daily OpenClaw token consumption from roughly 2.2 million tokens to 256,000 — without meaningfully changing what their setup does. The techniques are practical, reproducible, and directly usable by anyone running OpenClaw with persistent sessions and scheduled crons.

This comes the same day The Decoder reported that OpenClaw founder Peter Steinberger's team ran up a [$1.3M OpenAI API bill in 30 days](https://the-decoder.com/for-1-3-million-a-month-openclaw-founder-peter-steinberger-runs-100-ai-agents-that-code-review-prs-and-find-bugs/) running 100 Codex agents. Token costs are real, and knowing how to manage them matters.

## The Problem: Compaction Does Not Happen Automatically

The core issue is a widely-held assumption: that OpenClaw compacts session transcripts automatically over time. It does not — at least not without configuration.

By default, OpenClaw triggers compaction only when a session's prompt approaches the model's context-window limit. With modern frontier models carrying 200k+ token context windows, that threshold may never be reached in normal use. Every agent turn then replays the entire accumulated transcript from session start.

The developer confirmed this by checking `compactionCount` in `~/.openclaw/agents/main/sessions/sessions.json`. Every persistent session showed `compactionCount: 0` despite running for weeks. Each call averaged around 160,000 tokens — mostly in the `cacheRead` column, meaning the cache was doing its job but the transcript was still gigantic.

## Fix 1: Set a Transcript Size Trigger

The `agents.defaults.compaction.maxActiveTranscriptBytes` setting tells OpenClaw to compact when the session transcript hits a size threshold — regardless of whether the context window is anywhere near full.

```json
"agents": {
  "defaults": {
    "compaction": {
      "truncateAfterCompaction": true,
      "notifyUser": true,
      "maxActiveTranscriptBytes": "500kb",
      "memoryFlush": {
        "enabled": true,
        "forceFlushTranscriptBytes": "1mb"
      }
    }
  }
}
```

`memoryFlush.enabled` with `forceFlushTranscriptBytes` adds a memory-extraction pass before compaction: key facts from the transcript are saved to a separate memory file, then the transcript is truncated. You retain the agent's learned context while the session stays small.

## Fix 2: Audit Heartbeat and Cron for Duplication

The second source of waste was subtler. The developer's `HEARTBEAT.md` contained instructions to send a daily question if none had been sent yet. A separate cron job at 10:00 also sent that same question — and it pre-read `HEARTBEAT.md` as part of its setup.

The result: the cron sent the question, then every subsequent heartbeat tick that day loaded the workspace bootstrap, the full session transcript, and the relevant tools just to read `HEARTBEAT.md` and decide to reply `HEARTBEAT_OK`. With the heartbeat running four times a day, those no-op evaluations cost more than the actual question.

The fix was clean separation of responsibilities:

- **The cron** owns the outbound once-a-day question, with an idempotency check against a state file. It no longer reads `HEARTBEAT.md`.
- **The system prompt** owns the reactive "update state when a reply lands" half.
- **`HEARTBEAT.md`** was reduced to a single active-threads scan line.

## Fix 3: Find Your Actual Biggest Spenders

Before assuming heartbeat frequency is the problem, check the trajectory files. Per-session token usage lives in `~/.openclaw/agents/main/sessions/<sid>.trajectory.jsonl`. Each `model.completed` event has a `data.usage` object with `input`, `cacheRead`, `output`, and `total` fields.

The developer's script aggregates these by session key and date:

```python
import json, glob
from collections import defaultdict

base = "/path/to/agents/main/sessions"
day_key = defaultdict(lambda: defaultdict(lambda: [0, 0, 0, 0]))

for fp in glob.glob(f"{base}/*.trajectory.jsonl"):
    for line in open(fp):
        e = json.loads(line)
        if e.get("type") != "model.completed":
            continue
        u = e.get("data", {}).get("usage") or {}
        d = e.get("ts", "")[:10]
        sk = e.get("sessionKey", "?")
        day_key[d][sk][0] += u.get("input", 0)
        day_key[d][sk][1] += u.get("cacheRead", 0)
        day_key[d][sk][2] += u.get("output", 0)
        day_key[d][sk][3] += 1
```

When the developer ran this, heartbeat ticks were not even close to the top spenders. Four daily crons and a handful of group chat replies each accounted for more tokens. That reframe changed everything about where to look.

## Results

After all three changes — compaction trigger set to 500 KB, heartbeat/cron overlap eliminated, stale sessions reset — daily token usage dropped from ~2.2M to ~256k across the first full day. Per-call averages fell from 160k tokens to 35k. The `cacheRead` column, which had been growing as transcripts accumulated, fell around 7x.

The original post also notes that none of the sessions had reached the 500 KB compaction threshold yet by the time of writing. The setup is now correct — it just needs time to reach the trigger organically.

## Key Takeaways

- **Compaction is not automatic** without `maxActiveTranscriptBytes` set. Check `compactionCount` in your sessions.json.
- **Heartbeat frequency is often not the main cost.** Audit by sessionKey before cutting heartbeat cadence.
- **Cron and heartbeat can silently duplicate work.** Any pre-read of `HEARTBEAT.md` inside a cron payload creates overlap.
- **Trajectory files are your source of truth.** The `.trajectory.jsonl` per-session files have the exact token breakdown per call.

The full writeup, including session reset procedures, is at [brtkwr.com](https://brtkwr.com/posts/2026-05-17-reducing-openclaw-token-usage/).
