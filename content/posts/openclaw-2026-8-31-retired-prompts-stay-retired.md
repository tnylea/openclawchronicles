---
title: "OpenClaw Stops Retired Prompts Reappearing"
excerpt: "OpenClaw chat panes now keep retired prompts retired across terminal replay, later history pages, remounts, and cloud recovery."
coverImage: '/assets/images/posts/openclaw-2026-8-31-retired-prompts-stay-retired.png'
date: '2026-08-31T23:07:00.000Z'
dateFormatted: August 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-31-retired-prompts-stay-retired.png'
---

OpenClaw merged a Control UI chat repair tonight that prevents retired prompts from reappearing after history and replay events. [PR #134059](https://github.com/openclaw/openclaw/pull/134059), `fix(chat): prevent retired prompts from reappearing`, addresses a session-state bug in chat panes, outbox custody, Home context, and cloud recovery.

The short version: once a prompt has been retired, it should stay retired. That sounds obvious, but the UI had several paths that could rebuild visible messages from different sources and accidentally bring an old prompt back.

## The Bug

Retired chat prompts could reappear after a later history page omitted them and a terminal event replayed. Restoring an attributed initial prompt from the browser's stored snapshot could also leave two visible user sources.

The PR traces the issue to overlapping ownership decisions across renderer arrays, retained handoffs, delivered queue items, and custody loading. Integration also exposed a Home-context problem: session renames could leave the open reference stale, and global aliases could select another agent's row.

For users, this kind of bug is disorienting. A prompt that was already adopted, consumed, or retired should not come back as if it were still pending. Duplicate prompts also muddy sender attribution, attachment continuity, and later context.

## The Fix

OpenClaw now makes the application own retained submission display bytes and recorded retirement. A single pane boundary owns transcript publication and custody reconciliation. The outbox keeps retry authority, attachment hydration, client and attempt fencing, durable removal, and Blob release.

The implementation removes several duplicate or fragile paths:

- Reverse-importing renderer arrays.
- Full queue-item display caching.
- Initial-only wrappers.
- Duplicate identity, key, and classifier policy.
- Quadratic entry matching.

Presentation now uses the existing shared classifier with linear occurrence-preserving reuse. Retained display bytes cannot trigger another send. Run-only updates skip unchanged transcript arrays, and message construction remains lazy.

The Home panel now owns both context preparation and the model subscriptions it reads. Raw global aliases retain their agent when matching a session row, and failed history requests exit through the existing paused or unconfirmed outcome after ownership revalidation.

## Proof From The Merge

The final exact-head CI run completed successfully with 130 jobs passed, 13 intentionally skipped, and zero failures. The current proof includes 746 owner, protocol, and Gateway tests across 19 files, plus 25 browser cases covering cloud startup and recovery, Home updates, handoff and replay, and prompt attachments.

The PR also reports 61 history and lifecycle tests for the isolated-pane correction, a passing full `pnpm build`, and real-Gateway evidence for setup, custody, canonical promotion, hard reload, remount, and a deliberate identical second send.

The important proof detail is failure-first coverage: several receipt, replay, and isolated-pane cases failed before the migration and passed after it. Assertions and budgets were not relaxed.

## Why It Matters

Chat reliability is partly about persistence, but it is also about trust in what the interface shows. Users should be able to reload a session, page through history, or watch a terminal event finish without old pending prompts returning to the screen.

This fix keeps the visible conversation tied to custody and retirement records instead of inferring state from whichever history page happens to be loaded. That should make OpenClaw's chat panes calmer, more predictable, and safer for repeated long-running work.
