---
title: "OpenClaw Usage Reports Now Return Partial Results"
excerpt: "OpenClaw usage reports now return safe partial totals and narrowing hints instead of errors when broad session usage requests exceed the fixed read budget."
coverImage: '/assets/images/posts/openclaw-2026-10-14-usage-reports-partial-results.png'
date: '2026-10-14T08:05:00.000Z'
dateFormatted: October 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-14-usage-reports-partial-results.png'
---

OpenClaw merged a usage-reporting fix this morning that should make large team dashboards feel less brittle. [PR #171904](https://github.com/openclaw/openclaw/pull/171904) changes broad `sessions.usage` requests so they can return completed subtotals when the handler reaches its 15-second read budget, rather than failing the whole request.

That matters for teams with large session histories. Usage views are often most valuable when they answer broad questions: how much a group spent, which sessions consumed the most tokens, or whether a reporting period needs to be narrowed. Before this change, an over-budget request could produce an error instead of the partial information OpenClaw had already computed.

## What Changed

The new behavior returns marked partial data with `partial.reason: "time-budget"`, a partial cache status, and the existing hint to narrow the request by date range or selected session. The overview can display that hint through its existing query warning path.

The important detail is that partial totals are explicitly incomplete. OpenClaw is not pretending a timed-out wide report is definitive. It is giving operators the safest available slice of the answer, while still pointing them toward a narrower query when precision matters.

The PR also keeps cancellation semantics intact. If a caller disconnects, OpenClaw still cancels instead of publishing a late response.

## Why It Matters

Usage reporting is one of those features that gets tested by real-world data volume. A small installation may never hit the timeout path. A busy team with thousands of sessions and retained runs can.

The PR's measurement fixture included:

- 8,400 sessions
- 10,080 retained runs
- 168,000 assistant usage events
- 20.16 million verified tokens
- $201.60 in represented usage

In that fixture, eight concurrent cache-miss requests failed eight out of eight times before the change. After the patch, the same shape returned marked partial data eight out of eight times in roughly 15 seconds. Five of those responses returned full token totals; three retained the initial 256-session subtotal.

That is a practical reliability win: the operator gets a bounded answer and a next action instead of a blank wall.

## The Implementation Shape

The fix separates the data-work budget from the caller and publication lifetime. Report preparation now reuses transcript statistics and rewrite-generation data already obtained during discovery, deleting a second statistics scan.

One initial 256-instance read preserves an early subtotal. Remaining instances use one read, and completed subtotals survive budget cancellation. Publication reads for missing authority facts are also bounded by the deadline; unverified rows stay excluded, and late reads release their resources.

The PR does not introduce a schema change or stored-format migration. It does add production code, because a safe partial response needs to preserve family subtotals, carry the memory allowance through the worker boundary, and avoid mixing incomplete data with verified totals.

## Verification

The PR reports focused local coverage across the usage handler, worker I/O, and owner-attribution integration tests. New timeout assertions fail against the old handler and pass with the new partial-response path. Final broad CI passed on the merge head, including type checks, selected test shards, builds, UI gates, and baseline ratchets.

This is not claimed as a broad performance improvement. The author is careful about that: ordinary request timing stayed within observed drift. The win is narrower and more useful: when a usage report is too wide to complete inside the budget, OpenClaw now returns clear partial data instead of losing the report entirely.
