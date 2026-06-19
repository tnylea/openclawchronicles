---
title: "OpenClaw Adds Chat Session Rename Command"
excerpt: "OpenClaw merged a new /name chat command, letting authorized users rename the current session directly from text channels."
coverImage: '/assets/images/posts/openclaw-chat-session-rename-command.png'
date: '2026-06-19T08:05:00.000Z'
dateFormatted: June 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-chat-session-rename-command.png'
---

OpenClaw's chat interface picked up a small but practical workflow improvement overnight: merged PR [#88581](https://github.com/openclaw/openclaw/pull/88581) adds a `/name <title>` slash command for renaming the current session from a text channel.

That sounds modest, but it matters for anyone running several OpenClaw conversations in parallel. Until now, session naming was centered on the web or admin session manager. This change brings the same basic organization loop into the chat surface where many agent runs actually start.

## What The New Command Does

The new command lets an authorized sender rename the active session without leaving the current chat. The pull request describes the feature as a way to "name or rename the current session directly from any chat channel," rather than moving into a separate manager view.

There are two modes:

- `/name <title>` sets the current session label.
- `/name` with no argument shows the current name and a locally derived suggestion without changing anything.

The command uses OpenClaw's existing session label validation path. That means titles are trimmed, cannot be empty, and must fit the same maximum length rule used elsewhere. The PR also notes that it follows the same cross-store uniqueness rule as the web session patch path, so users should not accidentally create duplicate labels that confuse the session list.

## Why Chat-Native Naming Helps

Session names are one of those features that only become important when an agent system is working well enough to create clutter. A user might have one OpenClaw thread summarizing email, another running code review, another watching a deploy, and another exploring a research task.

If all of those threads are named by generated summaries or timestamps, switching between them becomes guesswork. A quick chat command changes that flow:

- Rename a support investigation while it is still active.
- Mark a long-running task with its customer, incident, or project name.
- Separate several similar agent runs without opening the web UI.
- Keep mobile and messaging-channel workflows organized.

The feature is especially relevant for chat-first OpenClaw setups. Telegram, Discord, Slack, Matrix, and similar channels are not just notification surfaces anymore; they are primary control planes for many users.

## Guardrails And Scope

The PR keeps the command inside the existing authorization model. Only authorized senders can rename a session, matching the permission shape used by nearby commands such as `/goal`.

The implementation also avoids a heavier model or config dependency. When `/name` is used without an argument, the suggestion is derived locally rather than calling a model. That keeps the no-argument path fast and predictable.

One limitation is documented directly in the pull request: this command writes the label but does not yet emit the same live `sessions.changed` notification that the web RPC path can emit. Already-open session lists will refresh when they next reload rather than through an immediate push. The PR treats notification parity as follow-up work, keeping this command focused on the chat rename path.

## Verification

The pull request includes unit coverage for rename persistence, no-argument suggestions, duplicate-label rejection, unauthorized senders, disabled text commands, and persisted-name rereads when the command parameters do not already include a session entry.

It also includes branch-local proof against OpenClaw's real session-store path. In that proof, `/name PR 88581 real proof` returned a rename reply, stopped further command handling, persisted the label to disk, and refreshed the in-memory session entry.

## The Bottom Line

OpenClaw PR [#88581](https://github.com/openclaw/openclaw/pull/88581) is not a giant architectural change. It is the kind of chat ergonomics polish that makes the system feel more usable in daily operation.

As OpenClaw keeps leaning into messaging channels as real interfaces, commands like `/name` reduce trips back to the web UI and make long-running agent work easier to track from the place where the work is already happening.
