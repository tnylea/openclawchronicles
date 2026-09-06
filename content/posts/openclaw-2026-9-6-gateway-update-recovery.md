---
title: "OpenClaw Makes Gateway Updates Resume Active Work"
excerpt: "OpenClaw preserves queued work, attachments, and child-task replies across Gateway updates so eligible interrupted sessions can resume cleanly after restarts."
coverImage: '/assets/images/posts/openclaw-2026-9-6-gateway-update-recovery.png'
date: '2026-09-06T08:05:00.000Z'
dateFormatted: September 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-6-gateway-update-recovery.png'
---

OpenClaw has merged a major Gateway recovery fix for active work interrupted by updates and restarts. [PR #139663](https://github.com/openclaw/openclaw/pull/139663), "fix: preserve work and queued inputs across gateway updates," landed at 07:51 UTC on September 6, 2026.

The change targets one of the more painful failure modes in an agent system: accepted work exists, but a Gateway update or restart interrupts the chain of ownership before the user sees a clean final answer. The PR says Gateway updates could previously strand follow-ups, leave interrupted child tasks without a parent reply, or resume native agents without their saved attachments.

That makes this more than a cosmetic reliability patch. It is a contract for preserving active conversations, queued input, media, and child-task completion when the runtime changes underneath them.

## What Changed

The new recovery path follows OpenClaw's existing execution, input-custody, and completion owners. Main turns use their admitted execution deadline. Recovered child tasks run under the current Gateway instance, and yielded parents wait for the recovered completion batch instead of losing the final follow-up.

On the browser side, OpenClaw now retains text and attachment bytes until transcript consumption, then reconciles durable receipts on reconnect. If an interrupted input matches under the same authenticated sender and physical session, it can receive fresh admission instead of requiring the user to rebuild the whole message by hand.

Native steering and ACP also get tighter ordering. Canonical input is persisted before execution can have effects, and Codex can restore saved documents and images through an optional host capability that shares the normal media preparation limits.

The PR deliberately avoids a broad storage or protocol shakeup. It adds no configuration option, SQLite schema, retention policy, dependency, or protocol version.

## Why It Matters

Gateway updates are a normal part of keeping OpenClaw current. The important user question is whether ongoing work survives that maintenance boundary.

With this merge, eligible interrupted work can resume, browser outboxes preserve input order, attachments remain usable, and parents receive final follow-ups after recovered children settle. Explicit cancellation and genuine execution timeouts still remain terminal, which matters because recovery should not turn a user abort into surprise continued execution.

The compatibility note is equally important. The PR says the owning Codex plugin artifact should be updated together with the Gateway. A pinned older plugin will not gain native attachment recovery from a core-only update, and a newer plugin on an older host refuses unsupported restoration.

## Evidence From The PR

The validation behind this change is unusually broad. The PR reports a full hosted CI pass on the reviewed head, including Windows. It also lists focused coverage across UI owner tests, reload and authentication helpers, native steering and routing checks, ACP and Gateway unit tests, restart integrations, pending-input storage, and main recovery.

The live scenario table is the clearest signal. In one case, a main task, child task, yielded parent, FIFO input, and saturated capacity all recovered with one final per task and no pending input. In another, a saved document and captionless image retained their bytes and produced the hidden verification values once. A warm restart with a pending attachment resumed the original task with no chat errors or stale banner.

The authors are careful not to claim production downtime guarantees. These were isolated Gateway and provider runs. Still, for OpenClaw operators, the direction is obvious: Gateway updates should be less likely to turn active work into missing replies, duplicate submissions, or lost attachments.
