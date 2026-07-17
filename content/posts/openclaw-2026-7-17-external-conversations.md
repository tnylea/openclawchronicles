---
title: "OpenClaw Separates External Conversations"
excerpt: "OpenClaw now separates external conversation references from local model sessions, improving durable sends and reply capture."
coverImage: '/assets/images/posts/openclaw-2026-7-17-external-conversations.png'
date: '2026-07-17T08:02:00.000Z'
dateFormatted: July 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-17-external-conversations.png'
---

OpenClaw's channel and agent runtime picked up a large conversation-model refactor on July 17. [PR #109411](https://github.com/openclaw/openclaw/pull/109411), `refactor: separate external conversations from local sessions`, merged at 07:09 UTC with 145 changed files and a new boundary between remote conversations and local model context.

The bug class is easy to understand if you have ever wired agents into chat systems. A local model session is not the same thing as the external conversation attached to it. When those identities blur, messages can loop into the wrong place, reply waits become brittle, and agents need to reason about channel targets instead of using a stable delivery API.

The PR calls out Reef as a visible example: a message intended for another agent could loop into the sender's local session, and waiting for a remote reply required fragile targeting logic.

## What Changed

OpenClaw now separates durable external `conversationRef` addresses from local session context. The refactor adds owner-only conversation discovery, durable fire-and-forget sends, and reply-correlated turns owned by the Gateway.

That creates a clearer shape for agent messaging:

- `conversations_list` discovers available external conversations.
- `conversations_send` sends without pretending the destination is a local session key.
- `conversations_turn` sends and waits for the exact correlated reply.

Transports remain channel plugins, but generic delivery, queue recovery, idempotency, and reply capture move into core.

## Reef Gets A Cleaner Runtime

The Reef channel gets specific attention in the PR. It now uses one process-wide live runtime, reserves its message ID before durable queueing, and consumes an exact correlated reply inline without launching a second local agent turn.

That last detail matters. If a tool asks a remote conversation a question, the exact answer should return to that tool call. Unsolicited messages and replies that arrive after process restart still flow through ordinary inbound dispatch.

The change also protects multi-agent operation IDs from colliding in the shared queue.

## Why This Matters

OpenClaw increasingly treats channels as more than notification pipes. Agents can work through Slack, Telegram, Reef, mobile surfaces, and other connected systems. As soon as agents communicate with external conversations, the runtime needs a stable address model that survives restarts and does not confuse local context with remote destinations.

This PR is not just a cleanup. It gives agents a more direct vocabulary for external conversations and lets the Gateway own correlation, durability, idempotency, and reply capture.

For operators, the practical win is fewer brittle channel-specific workarounds. A send should survive Gateway recovery. A turn should return the right reply. Unrelated inbound messages should not accidentally satisfy a waiting tool call.

## Evidence

The PR reports 80 outbound dispatch regressions, a focused four-file changed gate, and a Blacksmith Testbox integration proof with 319 assertions across eight focused files plus the full `pnpm check:changed` gate.

Earlier broad proof covered 35 changed test files across 11 Vitest shards, test types, Plugin SDK surface checks, protocol checks, Android i18n checks, and a production build.

A whole-branch autoreview found one plugin-dispatch queue-persistence bypass; the accepted fix was included before merge and regression-covered.

## Operator Takeaway

PR #109411 is a foundational runtime change for multi-agent and channel-heavy OpenClaw installations.

The headline is simple: external conversations are now first-class addresses, not session-shaped guesses. That should make cross-agent messaging, durable sends, and reply-correlated turns more predictable as OpenClaw's channel layer keeps growing.
