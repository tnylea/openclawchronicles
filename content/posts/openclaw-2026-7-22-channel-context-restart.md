---
title: "OpenClaw Channels Keep Context After Restarts"
excerpt: "OpenClaw now restores canonical transcript context for message channels after Gateway restarts and channel-history eviction."
coverImage: '/assets/images/posts/openclaw-2026-7-22-channel-context-restart.png'
date: '2026-07-22T08:02:00.000Z'
dateFormatted: July 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-22-channel-context-restart.png'
---

OpenClaw's message-channel memory got a broad reliability fix in [PR #112548](https://github.com/openclaw/openclaw/pull/112548), titled "fix(channels): restore assistant context after restart." The merged PR fixes a case where channel sessions could forget the assistant's own recent replies after a Gateway restart or channel-history eviction.

The canonical session transcript already had the missing turns. The problem was that several channel integrations rebuilt prompt history from process-local channel windows. When those windows were cold or evicted, the next turn could wake up without the recent assistant context that users expected the agent to remember.

## What Changed

The new shared path merges canonical transcript context at the prepared-turn boundary. Instead of solving this separately in each channel, OpenClaw reads the configured history-sized window from the active transcript branch and folds it into the prompt preparation flow.

The PR calls out Slack, Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Telegram, and WhatsApp as participating channels. Telegram's earlier one-off merge logic is removed, with the core layer now owning the transcript/history invariant.

The merge also handles the practical edge cases that matter in live rooms:

- Deduplicates live-cache copies.
- Preserves chronological order.
- Preserves reply targets.
- Skips `/new` and hard `/reset` boundaries.
- Excludes rollback and recovery side branches.
- Avoids double-rendering replies when warm live caches already contain them.

That combination is what makes the fix safer than simply stuffing old messages back into every channel prompt.

## Why It Matters

Channel agents live in messy real environments. Gateways restart, channel SDKs keep bounded local windows, and users expect the agent to pick up the thread without acting like its own last answer disappeared.

This change matters most in group rooms and long-running support-style threads, where the assistant's prior answer can shape the next instruction. Losing that answer can make the agent repeat itself, answer from stale assumptions, or miss the user's follow-up context.

The PR credits Joe Tam for identifying and proving the Slack case in earlier work. The final implementation turns that channel-specific report into a fleet-wide channel invariant.

## Proof From The PR

The final proof includes 316 focused tests across the shared context merge, active-branch reader, Telegram regressions, and Slack preparation. The covered behaviors include empty live windows after restart, cache/transcript dedupe, chronological bounded merge, pinned reply targets, hard boundary skips, active-branch filtering, and cutoff paging past one projection page.

The Blacksmith changed gate also passed, covering formatting, API and boundary guards, production and test typechecks, scoped lint, import cycles, database-first checks, and channel guards.

For users, the outcome is simple: after a restart or channel-history eviction, OpenClaw should remember the recent turns already stored in the resolved session transcript.
