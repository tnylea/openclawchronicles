---
title: "OpenClaw Fixes Tool-Heavy Session Overflow"
excerpt: "OpenClaw now lets tool-heavy sessions reach provider context checks before compacting, preserving more history during long-running work."
coverImage: '/assets/images/posts/openclaw-2026-7-20-tool-heavy-sessions.png'
date: '2026-07-20T23:00:00.000Z'
dateFormatted: July 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-20-tool-heavy-sessions.png'
---

OpenClaw merged a high-priority agent runtime fix tonight that should matter to anyone who keeps long sessions alive while running a lot of tools. [PR #110297](https://github.com/openclaw/openclaw/pull/110297), titled "fix(agents): avoid synthetic overflow in tool-heavy sessions," changes how OpenClaw treats local prompt-pressure estimates before handing work to a model provider.

The bug was subtle but painful. A restored session with many large tool results could look too large to OpenClaw's conservative local estimator, even when the actual provider would have accepted the projected prompt. In that case, OpenClaw could trigger whole-session compaction early, rewrite history, and drop useful tool output before the model ever had a chance to process it.

## What Changed

The PR moves generic character-pressure checks back into the role they are best suited for: prompt shaping and diagnostics. They can still inform how OpenClaw prepares a request, but they are no longer treated as proof that the provider will reject the prompt.

The stricter recovery path now waits for a real provider context rejection before treating the turn as an overflow. When that happens, OpenClaw records the final provider request identity so it will not keep resending the same rejected payload in a loop. Materially changed retries can still proceed.

The author calls out that this touches three generic gates where false positives could previously be manufactured:

- Aggregate preflight pressure.
- Normal prompt preflight estimation.
- Always-on tool-loop character guards.

There are no configuration, protocol, provider identity, public API, or persisted-session format changes in the PR.

## Why Operators Should Care

Tool-heavy OpenClaw sessions are where the product starts to feel like infrastructure. A session may accumulate long command outputs, structured search results, logs, file reads, and test traces. If the local estimator compacts too early, the user loses exactly the context that made the session valuable.

This fix lets bounded provider prompts proceed until the provider itself says the context is too large. That is a better authority boundary. Local estimates remain useful, but they stop overruling a provider that can handle the request.

The practical result is less unnecessary compaction, fewer history-loss surprises, and better continuity when returning to a restored session with a lot of accumulated tool evidence.

## Proof From The PR

The reproduction is concrete. On the baseline, the author built a Gateway session with twelve real 50,000-character `exec` results under a large model window, restarted with a smaller model setting, and sent a normal follow-up. The baseline triggered synthetic compaction and retained only one of the twelve historical tool results.

On the patched head, the same restart scenario completed without rerunning tools, and all twelve historical tool results plus the newest sentinel reached the follow-up request. The PR reports 394 focused tests passing across 14 files, along with `pnpm check:changed`, `pnpm build`, `git diff --check`, and a clean autoreview.

For OpenClaw users, this is a quiet but important reliability improvement: long-running sessions should keep their hard-won context until a real provider limit requires recovery.
