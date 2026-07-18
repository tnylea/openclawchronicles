---
title: "OpenClaw Keeps Background CLI Commands Visible"
excerpt: "OpenClaw now tracks agent-started background CLI commands as privacy-safe tasks across web, iOS, and Android until completion."
coverImage: '/assets/images/posts/openclaw-2026-7-18-background-command-tasks.png'
date: '2026-07-18T08:01:00.000Z'
dateFormatted: July 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-18-background-command-tasks.png'
---

OpenClaw is making long-running agent work easier to supervise. [PR #110468](https://github.com/openclaw/openclaw/pull/110468), `fix: show background commands after agent turns`, merged at 07:51 UTC on July 18.

The fix targets a simple but serious visibility gap: a user could ask an agent to start a CLI command in the background, the agent turn could end, and the running work would not appear in the Web, iOS, or Android task view.

## Background Work Needs A Handle

Background commands are useful precisely because they outlive a single reply. Builds, imports, test runs, media processing, and deployment checks can all take longer than one agent turn.

But once work keeps running after the visible conversation moves on, users need a durable place to see whether it is still active, completed, failed, or cancellable.

PR #110468 projects background exec sessions into the durable task ledger after the exec actually yields. The task row is finalized before the existing completion heartbeat wakes the agent, which lets the UI update and the agent continue through the normal lifecycle.

## Privacy-Safe Task Rows

The implementation deliberately avoids persisting command text or command output in task metadata. Instead, the task view shows a privacy-safe row that represents the active background command.

That row can then move through the expected states:

- running while the command is active;
- completed after a successful exit;
- failed after a nonzero exit;
- cancellable by the operator;
- reconciled after a Gateway restart.

The release note in the PR puts the user impact plainly: background CLI commands now remain visible in task views until completion.

## Why It Matters

This is a reliability change, but it also changes how much trust users can place in OpenClaw's task surfaces. If a task view says nothing is running while a command is still active, operators are forced to check logs, terminals, or agent transcripts to understand what is happening.

With this merge, Web, iOS, and Android can show one running background task for an agent-started CLI command after the initiating turn ends, then move it to finished when the command exits.

That is especially important for mobile supervision. A user who starts work from chat and then checks from a phone should see the same background state as someone sitting at the web UI.

## Evidence

The PR reports live proof with an approved OpenAI Responses API run. The agent launched a 90-second command, ended its turn with `STARTED`, and the Web task badge plus rail showed one running CLI task. Completion then triggered a second model turn through the existing exec-event heartbeat path.

The same row moved to Completed with a 1 minute 30 second duration and a command-completed summary.

Validation also covered format checks, typechecking, core and UI lint, import-cycle checks, SDK boundaries, dependency checks, database-first guards, 159 focused task and exec tests, 162 wider lifecycle tests, two Web background-task E2E tests, Android unit coverage, and iOS parsing and display assertions.

## Operator Takeaway

OpenClaw agents can now start background command work without making that work disappear from the user's control plane. The command remains private, but the lifecycle becomes visible.
