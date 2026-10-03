---
title: "OpenClaw Fixes Gateway Stalls During Reviews"
excerpt: "OpenClaw PR 164049 stops background Skill Workshop reviews and rooted cron jobs from freezing Gateway RPCs while plugins prepare."
coverImage: '/assets/images/posts/openclaw-2026-10-3-gateway-skill-review-stalls.png'
date: '2026-10-03T08:10:00.000Z'
dateFormatted: October 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-3-gateway-skill-review-stalls.png'
---

OpenClaw merged a high-priority Gateway reliability fix in [PR #164049](https://github.com/openclaw/openclaw/pull/164049): background Skill Workshop reviews and rooted cron jobs should no longer freeze user-facing Gateway traffic while their runtimes prepare.

The bug was nasty because it affected work that is supposed to be background work. According to the PR, a Gateway could freeze for roughly two and a half minutes when a Skill Workshop review in default `auto` mode or a cron job with an execution root started. During that window, websockets could drop, Control UI reconnects could time out, and a chat message typed meanwhile might never be admitted.

## What Changed

Rooted runs use a specific execution root, such as an agent's `workshop-skills` directory, for filesystem access. The orchestrator was also using that directory as the identity of the prepared model runtime and plugin metadata. Because that identity did not match the Gateway's configured generation, OpenClaw synchronously built a new runtime and cold-loaded missing tool plugins on the Gateway main thread.

The fix separates those concerns. When a rooted run's bootstrap workspace resolves to the agent's canonical workspace, OpenClaw now selects the already prepared runtime and plugin metadata from that canonical workspace. The run still executes, sandboxes, and compacts inside its execution root.

That distinction is important. The PR says runs whose bootstrap workspace is absent or not canonical keep their own workspace-scoped generation, so the trust boundary is not widened just to avoid a stall.

## Why Operators Should Care

Skill Workshop reviews and cron jobs often run when the user is not watching them. They also tend to run in the same environment where people expect chat, Control UI, and RPCs to remain responsive. A background review that blocks foreground traffic defeats the purpose of having it in the background.

The reported before-and-after numbers show the shape of the improvement:

- Startup total dropped from 2,405 ms to 28 ms in the reproduction.
- The `prepared-runtime` stage dropped from 2,350 ms to 1 ms.
- Extra runtime-registry acquisitions dropped from one to zero.
- Plugin metadata snapshot builds dropped from one to zero.

Those are focused reproduction numbers, not a universal speed guarantee. But they directly address the failure mode: rooted background work no longer forces a new plugin/runtime preparation path on the Gateway main thread when a safe prepared generation already exists.

## File Access Still Stays Rooted

The repair also preserves the reason rooted runs exist in the first place. The new regression test proves that the read tool can read inside the execution root and rejects a file in the canonical workspace. In other words, the runtime and metadata can be reused without letting the background run wander through the agent's broader workspace.

That is the right trade: reuse expensive prepared state for responsiveness, but keep file access confined to the job's root.

## Validation

The PR includes a production trace showing a long `prepared-runtime` stage and delayed liveness heartbeat before the fix. It also adds regression coverage for workspace selection, runtime binding, and compaction. The focused rooted-run proof failed on the parent commit and passed with the fix.

For users, the takeaway is simple. If your Gateway felt like it briefly disappeared whenever automated reviews or rooted cron jobs started, this is the fix to watch. Update to a build that includes [PR #164049](https://github.com/openclaw/openclaw/pull/164049), then keep an eye on Gateway liveness and Control UI reconnect behavior during the next background review.
