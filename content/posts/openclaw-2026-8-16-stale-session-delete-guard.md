---
title: "OpenClaw Blocks Stale Session Delete Races"
excerpt: "OpenClaw now rejects stale session delete confirmations, protecting replacement conversations from same-key cleanup races in the Control UI."
coverImage: '/assets/images/posts/openclaw-2026-8-16-stale-session-delete-guard.png'
date: '2026-08-16T08:00:00.000Z'
dateFormatted: August 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-16-stale-session-delete-guard.png'
---

OpenClaw merged a user-facing session safety fix in [PR #124097](https://github.com/openclaw/openclaw/pull/124097), closing a race where an operator could confirm deletion for one durable session generation and accidentally delete a newer replacement that reused the same key.

That is the kind of bug that looks small in the UI and large in practice. A stale confirmation dialog should never become authority over a different conversation, especially in an agent system where session history, routing, and transcript identity are part of the operational record.

## What Changed

The fix carries the listed row's existing `sessionId` through OpenClaw's shared delete capability as an `expectedSessionId`. The Gateway already had the compare-and-delete fence, so the repair focuses on making every Control UI delete path supply the durable identity it means to delete.

The affected surfaces include:

- Control UI sidebar single-session menus
- Control UI batch delete menus
- Chat header and session organizer flows
- The Sessions page archived-delete path

OpenClaw also tightened the authorization envelope around this operation. A safe `sessions.delete` request can include `expectedSessionId` only when `archivedOnly` is exactly `true`; broader or malformed destructive requests remain admin-only.

## Why It Matters

Session keys are user-facing handles, but durable IDs are the safer authority. Without the expected-ID check, a delete confirmation could be assembled against one row while the underlying session was replaced before the request completed. The UI might still appear to be confirming the old row, but the backend could see the reused key and delete the wrong live record.

PR #124097 turns that into a clear retry outcome instead. If the durable identity has changed, the replacement remains visible and the operator is told the session changed before deletion.

## Evidence From The PR

The PR includes focused unit and browser coverage. The author reports 103 UI/session tests passing, 23 Gateway lifecycle tests passing, and Chromium lifecycle coverage for stale same-key rejection, duplicate confirmation handling, archive gating, reconnect retention, and selection safety.

The review notes also call out a small but useful polish fix: batch delete errors now use the canonical UI formatter, so users do not see raw `GatewayRequestError:` text when a retry is needed.

## The Larger Direction

OpenClaw's recent session work has been converging on a simple principle: destructive actions should bind to the exact durable thing the user saw, not a reusable label. This patch applies that principle to session deletion and keeps the ordinary delete workflow intact for legacy rows that do not have durable IDs.

For operators, the headline is straightforward: stale delete confirmations now fail closed instead of deleting the wrong replacement session.
