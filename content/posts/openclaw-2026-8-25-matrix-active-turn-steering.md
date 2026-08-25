---
title: "OpenClaw Matrix Follow-Ups Now Steer Active Turns"
excerpt: "OpenClaw's Matrix channel now routes follow-ups and /steer commands into active runs while preserving durable transcript history."
coverImage: '/assets/images/posts/openclaw-2026-8-25-matrix-active-turn-steering.png'
date: '2026-08-25T23:03:00.000Z'
dateFormatted: August 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-25-matrix-active-turn-steering.png'
---

Matrix users got a major OpenClaw workflow repair tonight with [PR #128907](https://github.com/openclaw/openclaw/pull/128907), which makes follow-up messages reach an already active agent turn instead of getting stuck behind it or disappearing from the durable transcript.

The bug had two related shapes. An ordinary Matrix follow-up could remain behind an active turn before OpenClaw's configured queue policy had a chance to adopt it. Separately, an authorized `/steer` command could affect the active agent run while bypassing the prepared-turn path that records a durable user transcript row. In real use, that meant the active run could change, but Control UI and session history would not show the command that changed it.

## What Changed

The Matrix handler already used a shared replay guard for inbound events. The fix carries that ownership into the shared turn-adoption lifecycle so a deferred Matrix turn can transfer claim settlement to the reply lane, commit when durable adoption succeeds, and release for replay if abandoned.

The `/steer` path now follows the same prepared-message machinery as ordinary follow-ups. Authorized `/steer <message>` strips only the command prefix, preserves the body, and continues through normal prepared-turn routing with a turn-local steer override.

That means OpenClaw now preserves the contracts that matter for a live agent session:

- The follow-up gets one stable queue identity.
- The user message is persisted as a durable transcript row.
- The active run is linked with `steerTargetRunId`.
- Media, abort propagation, and fallback behavior stay on the standard path.
- If the active run disappears during the race, the message follows the existing fallback path instead of being lost.

The PR does not add Matrix-specific steering semantics, change the default queue policy, add configuration, or change the durable replay-key format. It wires Matrix back into the common OpenClaw lifecycle.

## Why It Matters

Long-running agent work is conversational. A user may correct a requirement, add a constraint, or reverse an instruction after the run has already started. Matrix users should be able to do that without starting a second run, losing a transcript row, or watching Control UI drift from what actually happened.

The fix is especially important for teams using Matrix rooms as operational control surfaces. Follow-ups are now visible, durable, and associated with the run they steered. That makes audit trails and later review much more trustworthy.

## Real-World Proof

The PR includes production Matrix evidence. In one test, an active OpenClaw run was asked to list all 50 U.S. states, create a DOCX, and convert it to PDF. While the run was active, the user sent an ordinary follow-up asking for reverse alphabetical order, then an explicit `/steer actually alphabetical order` correction.

The trace showed both events entering the same active OpenClaw run and the same active Codex turn. OpenClaw persisted each follow-up exactly once, attached both to the active run with the same steer target, and Control UI displayed the durable rows. The final artifacts reflected the latest steering instruction, and no second run was created.

Focused verification covered 26 active-steering end-to-end tests, four Matrix active-turn steering cases, eight explicit steer command routing cases, eleven structured command-turn context cases, queue override coverage, prepared-turn persistence, lint, formatting, and core production TypeScript checks.

For Matrix operators, the headline is simple: a correction sent mid-run now behaves like part of the run, and the record tells the same story.
