---
title: "OpenClaw Keeps Agent Terminals From Exhausting Gateways"
excerpt: "OpenClaw now evicts idle viewer-free agent terminals under pool pressure so busy coding turns cannot brick exec access across a Gateway."
coverImage: '/assets/images/posts/openclaw-terminal-session-eviction-fix.png'
date: '2026-07-29T23:03:00.000Z'
dateFormatted: July 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-terminal-session-eviction-fix.png'
---

OpenClaw landed a P1 Gateway fix tonight for a failure mode that mostly shows up under heavy agent execution. [PR #116101](https://github.com/openclaw/openclaw/pull/116101), titled `fix(gateway): evict idle agent terminal sessions under pool pressure`, prevents agent-opened terminal sessions from accumulating until the whole Gateway refuses new terminal or exec work.

The bug came from persistent login shells opened by the `terminal` tool, including shells created from code-mode `exec` scripts. Those shells could outlive the command that opened them, but they were excluded from automatic reclamation. They did not get a reaper, did not count toward the detached cap, and were not covered by `gateway.terminal.detachedSessionTimeoutSeconds`.

Once enough of them accumulated, the Gateway hit its global 24-session cap. New terminal and exec opens then failed with `terminal session limit reached (24)` until the Gateway restarted.

## What OpenClaw Does Now

When a new terminal open happens under pool pressure, OpenClaw reclaims the longest-idle, viewer-free, agent-owned session instead of failing immediately. The important qualifier is viewer-free: interactive collaborative terminals that a user can see or type into are not evicted.

The implementation uses a claim-and-commit design. A candidate is claimed before the asynchronous spawn so concurrent opens do not select the same victim. Then OpenClaw reselects fresh during the synchronous post-spawn window. If the claimed session gained a viewer, produced output, or exited during the spawn, it is spared.

That design avoids turning a capacity fix into a data-loss race. Failed or cancelled spawns release their claim, and commit-time capacity checks count other outstanding reservations so out-of-order spawn completion cannot register sessions past the hard cap.

## Why It Matters

This fix is especially relevant for coding agents and automation-heavy Gateway installs. A few deep multi-exec turns should not permanently break command execution for every later turn. The accepted tradeoff is narrow: a silent, viewer-free background shell may lose its PTY under pressure. Active streams, viewer-attached sessions, and connection-owned terminals are protected.

The PR reports live before-and-after proof on a scratch dev Gateway. Before the patch, repeated multi-exec turns failed after hitting the 24-session limit. After the patch, three consecutive 12-exec turns completed, 12 idle evictions were logged, and no limit errors occurred.

## Operator Takeaway

There is no new configuration to set. The Gateway now treats idle agent terminals as reclaimable capacity when the alternative would be refusing new work.

The test suite added coverage for idle selection, viewer and connection protection, sessions that gain viewers mid-spawn, stale activity reselection, out-of-order cap races, cancelled-open claim release, and spawn-failure victim survival. That is the right shape of coverage for a concurrency-heavy resource manager change, and it should make high-throughput agent runs less likely to require manual Gateway restarts.
