---
title: "OpenClaw Gateway Restarts Now Retain Worker Edits"
excerpt: "OpenClaw Gateway restarts now retire interrupted node-backed turns while retaining the machine, workspace, and file edits for the next message."
coverImage: '/assets/images/posts/openclaw-2026-9-28-gateway-restart-retains-edits.png'
date: '2026-09-28T08:00:00.000Z'
dateFormatted: September 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-28-gateway-restart-retains-edits.png'
---

OpenClaw merged a P0 Gateway fix Monday morning that changes what happens when a restart interrupts a node-backed agent turn.

The change landed in [PR #159565](https://github.com/openclaw/openclaw/pull/159565), titled `fix(gateway): a Gateway restart fails in-flight worker turns and loses their edits`. The bug was serious because it combined two bad outcomes: the running turn could fail during restart, and edits already made on the retained machine could disappear from the next message.

## What Changed

The PR says graceful stop or restart could previously reject the worker protocol while a cloud or paired-device session was still running. The worker might finish a tool call, but the Gateway would no longer accept the result. After restart, the session placement could be marked failed and the workspace rebuilt from the last accepted snapshot.

That meant a tool call could appear to have succeeded in the transcript while the next turn found the edited file missing.

The new behavior is more honest and more useful:

- The interrupted turn is retired.
- The node-backed machine and workspace are retained.
- File changes already made by the interrupted turn are reconciled.
- The next message continues on the same machine with fresh authority.
- Shutdown no longer waits minutes for worker turns it cannot serve.

There is still no automatic replay of the interrupted tool call. That is the right boundary: OpenClaw preserves the workspace state it can verify without pretending it can safely rerun arbitrary work.

## Why It Matters

Gateway restarts are routine. They happen during updates, operator maintenance, local development, and recovery from unrelated failures. If a restart can silently discard remote workspace edits, users lose trust in both the transcript and the machine state behind it.

This fix makes the failure mode clearer. A restart may still interrupt the active turn, but the worktree does not vanish simply because the Gateway process changed underneath it.

For teams using paired devices or cloud workers, that is a major reliability improvement. Long-running agent sessions often make incremental file edits before a final result is delivered. Preserving those edits gives the user and the next turn something real to inspect, continue, or clean up.

## Evidence From The PR

The PR describes a live reproduction with a paired-device session host. A turn ran a command that wrote `restart-proof.txt`; the Gateway received SIGTERM during the run, logged active work still draining, and then rejected the worker reconnect with HTTP 503. Shutdown took more than three minutes, and after restart the next turn could not find the proof file.

After the fix, the Gateway treats that restart path as an interrupted turn with retained machine state rather than a failed placement that discards local edits.

This is not a flashy feature, but it is exactly the kind of repair OpenClaw needs as more agent work moves onto durable workers: restarts should interrupt the conversation, not erase the workspace.
