---
title: "OpenClaw Adds Sessions Compact CLI Command"
excerpt: "OpenClaw merged a sessions compact CLI command, giving operators a safer direct path for transcript compaction and recovery workflows."
coverImage: '/assets/images/posts/openclaw-2026-6-19-sessions-compact-cli.png'
date: '2026-06-19T23:15:00.000Z'
dateFormatted: June 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-19-sessions-compact-cli.png'
---

OpenClaw merged a practical new operator command today: PR [#91378](https://github.com/openclaw/openclaw/pull/91378) adds `openclaw sessions compact <key>` on top of the existing Gateway `sessions.compact` RPC.

The change also makes CLI `agent --message '/compact'` fail loudly with a redirect instead of silently treating `/compact` as an ordinary agent message. That is an important behavior correction. Compaction changes the shape of a transcript, so users should reach it through a deliberate CLI command rather than an ambiguous chat-style slash command.

## What The Command Does

The new command gives operators a direct CLI path to compact a session transcript by key. According to the PR, the Gateway remains responsible for target resolution and active-run interruption, while transcript mutation stays behind the session accessor.

The implementation preserves inherited `sessions --agent` and `--json` behavior, but rejects list-oriented options that do not make sense during compaction. Unsupported options include `--store`, `--all-agents`, `--active`, `--limit`, and `--verbose`.

That is a good boundary. Compaction is a mutation, not a list or query operation, so the CLI should be strict about flags that could make the command look broader or safer than it is.

## Safer Transcript Mutation

The PR spends significant attention on safety around transcript rewriting. It says the command archives the original before installing the normalized replacement, installs the replacement transcript with mode `0600`, supports rollback, and cleans up partial temporary files.

The compaction path also preserves the required transcript header and active tree semantics. Removed ancestors are re-rooted, malformed controls remain transparent, out-of-window leaf targets fail safe, and retained compaction boundaries follow the normalized active branch.

In plain terms: OpenClaw is not just deleting old transcript lines. It is trying to preserve the session tree that makes active and historical work understandable after the transcript is trimmed.

## Better Codex Behavior

The PR also handles Codex's app-server compaction behavior. It reports `thread/compact/start` as pending instead of treating the request as a no-op.

That distinction matters because Codex reports compaction completion asynchronously through turn and item notifications. If the CLI pretends the operation is complete immediately, users can get a false sense of certainty. Pending status matches the real workflow more closely.

## Why Operators Will Care

Long-running OpenClaw sessions accumulate history. That history is useful until it becomes too large, stale, or expensive to keep in the active window. Compaction helps preserve useful context while reducing transcript weight.

The new CLI command helps several workflows:

- Recover oversized or messy sessions without opening a web UI.
- Run compaction from scripts or maintenance shells.
- Fail fast when an operator tries to use chat slash-command syntax in the wrong place.
- Keep transcript replacement private and rollback-aware.

For people running OpenClaw as infrastructure, that is a meaningful improvement. It turns a lower-level Gateway capability into an operator-facing command with proof around the dangerous parts.

## Verification

The pull request includes a detailed real-behavior proof. The author says tests used a local Node checkout plus an AWS Crabbox Linux lease named `swift-lobster`, with Gateway tests using a real in-process Gateway WebSocket and on-disk session stores and transcripts.

The verification list includes tests for the session accessor, sessions compact command, CLI registration, Gateway session compaction, session list changes, and preview recovery. The PR also says the replacement transcript can be reopened by `SessionManager` without changing the selected branch.

## The Bottom Line

OpenClaw PR [#91378](https://github.com/openclaw/openclaw/pull/91378) is a strong operator-quality feature. It gives transcript compaction a real CLI surface, rejects confusing slash-command usage, and wraps transcript mutation in archival, rollback, and privacy safeguards.

As OpenClaw sessions become longer-lived and more operational, commands like `openclaw sessions compact` are the difference between a clever agent prototype and a system that can be maintained over time.
