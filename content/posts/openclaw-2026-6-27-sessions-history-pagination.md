---
title: "OpenClaw Adds Sessions History Pagination"
excerpt: "OpenClaw agents can now page through older bounded transcript windows with sessions_history offsets for safer recovery and audits."
coverImage: '/assets/images/posts/openclaw-2026-6-27-sessions-history-pagination.png'
date: '2026-06-27T23:02:00.000Z'
dateFormatted: June 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-27-sessions-history-pagination.png'
---

OpenClaw merged a session-recovery improvement tonight that gives agents and operators a cleaner way to inspect older parts of long child-session transcripts. [PR #97101](https://github.com/openclaw/openclaw/pull/97101) adds explicit offset pagination to `sessions_history` and Gateway `chat.history`.

Before this change, parent agents using `sessions_history` were anchored to the newest bounded tail of a child session. If the relevant event lived just outside that tail, there was no supported cursor for walking backward through older transcript windows without dropping down to raw JSONL files.

## What Changed

The new behavior adds explicit offset pagination for bounded, sanitized OpenClaw transcript windows. Callers can request `sessions_history` with `offset: 0`, then follow returned pagination metadata to inspect older windows.

The response now includes:

- `offset`
- `nextOffset`
- `hasMore`
- `totalMessages`

The existing no-offset behavior remains the newest-tail view, so current callers do not need to change. Offset pagination is opt-in for workflows that need deterministic recovery or audit traversal.

The implementation also keeps important safety boundaries in place. It preserves display sanitization and byte caps, computes continuation from the final returned page boundary, overreads one context row for stale announce-pair filtering, and keeps offset pages scoped to OpenClaw transcript windows instead of merging entire external CLI fallback imports into every page.

## Why Agents Need This

Long-running delegated work is normal for OpenClaw. A parent agent may spawn a child task, step away, resume later, and need to understand exactly what happened in the middle of that child transcript. The newest tail is useful for quick status, but it is not enough for recovery.

Pagination makes that inspection repeatable. Instead of guessing with different limits or reading raw storage, the agent can move through transcript windows using `nextOffset`. That is a better fit for automated recovery, post-incident review, and multi-agent audit workflows.

It also keeps the boundary narrower than a full raw-history export. The PR explicitly says this is not a readable full-history export surface; broader product and API decisions remain tracked separately under issue #90981.

## Real History Proof

The PR includes both focused tests and an Azure Crabbox proof using an isolated seeded OpenClaw state directory. The proof created a 64-row transcript, invoked the real `sessions_history` tool through embedded Gateway `chat.history`, and followed `nextOffset` values across five pages.

The pages returned the expected windows:

- Page 1: rows 57 through 64
- Page 2: rows 49 through 56
- Page 3: rows 41 through 48
- Page 4: rows 33 through 40
- Page 5: rows 25 through 32

The proof verified matching page sequences, offsets, next offsets, and ascending order inside each page. Focused Vitest shards also covered offset validation, forwarding, final byte-budget cursor calculation, embedded Gateway parity, protocol schema acceptance, and docs/tool metadata updates.

## Operational Impact

For operators, this is a quieter but meaningful improvement to supportability. When a delegated agent gets stuck, loses context, or needs to explain a long-running child task, `sessions_history` can now retrieve older bounded windows through the supported tool surface.

That should make recovery less dependent on filesystem spelunking and more available to the agents themselves. In a system built around delegated work, that is a worthwhile step toward more self-service debugging.
