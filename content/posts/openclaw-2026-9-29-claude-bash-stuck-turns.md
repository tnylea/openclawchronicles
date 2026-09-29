---
title: "OpenClaw Fixes Claude Bash Stuck Turns"
excerpt: "OpenClaw now closes Claude CLI turns correctly after background Bash completions, keeping replies intact and sessions ready for the next input."
coverImage: '/assets/images/posts/openclaw-2026-9-29-claude-bash-stuck-turns.webp'
date: '2026-09-29T23:01:00.000Z'
dateFormatted: September 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-29-claude-bash-stuck-turns.webp'
---

OpenClaw merged a P1 Anthropic adapter fix Tuesday in [PR #161260](https://github.com/openclaw/openclaw/pull/161260), titled `fix(anthropic): prevent stuck turns after background Bash completes`.

The issue affected Claude CLI sessions that used foreground Bash work which later moved into the background. In that interleaving, OpenClaw could already have delivered the answer to the user, but the underlying turn stayed open until the no-output watchdog eventually killed it.

That is a frustrating kind of reliability bug: from the user's perspective, the reply may look complete, but the session is not truly ready for the next instruction.

## What Changed

The patch keeps a unified record of unsettled task IDs across Bash commands, agents, and workflows. Instead of assuming a task is complete when it disappears from the live-task list, OpenClaw now consumes queued notifications in result order and lets inline replay receipts settle through the query that owns them.

The implementation also records authorized foreground Bash intent. That lets OpenClaw recognize an automatic backgrounding timeout even when the first task event already reports that the work has moved into the background.

For users, the behavior is simpler:

- Background completions finish normally.
- Overlapping replies remain attached to the correct session.
- Explicitly backgrounded commands stay non-blocking.
- Failed continuations retire the subprocess rather than leaking unfinished work into a later turn.

The PR states that existing permission decisions and final-write authority checks stay unchanged, which matters because the fix touches a boundary between subprocess control, user-visible replies, and durable session state.

## Why It Matters

OpenClaw increasingly treats CLI-backed agents as long-lived collaborators rather than one-shot command runners. A warm Claude Code process can handle follow-up work quickly, but only if the previous turn has actually settled.

When a background Bash completion left the turn open, the session could sit in a misleading half-finished state. The next input might be delayed, rejected, or tangled with cleanup from work the user thought had already completed.

This fix makes that lifecycle sharper. A completed answer can settle as completed. A bad continuation can be retired cleanly. A subprocess that remains healthy can accept the next input without waiting for a watchdog to guess what happened.

## Proof From The PR

The maintainers report 47 production-transport regression tests covering missing receipts, batching, overlapping Bash, agent, and workflow completions, automatic versus explicit backgrounding, malformed output retirement, next-input reuse, and late permission-denial handling.

They also ran real Claude Code 2.1.272 through the patched production adapter with a local synthetic Anthropic provider. Two probes passed: one with separate overlapping queries that delivered all three results, and one with inline completion that delivered two results. In both cases, the warm process accepted the next input afterward.

For operators using OpenClaw with Claude-backed command execution, this is the sort of fix that should reduce mysterious "it answered but still seems busy" moments.

