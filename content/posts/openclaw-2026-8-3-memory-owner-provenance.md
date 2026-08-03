---
title: "OpenClaw Tightens Trusted Memory Provenance"
excerpt: "OpenClaw PR #118987 records owner provenance at the transcript boundary so durable memory can trust real operator input only."
coverImage: '/assets/images/posts/openclaw-2026-8-3-memory-owner-provenance.png'
date: '2026-08-03T23:06:00.000Z'
dateFormatted: August 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-3-memory-owner-provenance.png'
---

OpenClaw merged [PR #118987, "fix(memory): persist trusted owner provenance at the canonical transcript boundary"](https://github.com/openclaw/openclaw/pull/118987), a compact but important memory-safety fix for multi-surface agent runs.

The root problem was provenance drift. Trusted transcript ownership could be inferred or lost separately across Gateway agent runs, local CLI recording, direct replies, collected followups, and durable overflow summaries.

That created two bad possibilities. Synthetic inter-session or internal input could become owner-authored durable memory. At the same time, real operator-originated owner turns could lose their authoritative ownership signal before reaching the memory system.

## The Transcript Boundary Becomes Canonical

The repair records ownership and provenance together at the existing `buildPersistedUserTurnMessage` persistence owner. Only genuine external-user owner input is eligible for trusted memory. Inter-session and internal-system turns remain explicitly untrusted for memory, while keeping their separate execution permissions intact.

That distinction matters. A cron job, collected followup, direct auto reply, or internal session message may be allowed to execute in a privileged workflow. That does not automatically mean it should be remembered as something the owner personally said.

The PR forwards authoritative owner and provenance facts from the Gateway, local CLI recorder, and overflow-summary producer. Other producers inherit the canonical rule instead of each making separate ownership decisions.

## Why This Matters For OpenClaw Memory

OpenClaw's memory layer is most useful when it can safely preserve preferences, facts, decisions, and recurring context. But memory gets risky when it cannot separate the owner's words from internal summaries or external participants.

This PR narrows that trust decision to one transcript boundary. It preserves cron execution privileges, sender metadata, transport metadata, hooks, idempotency, and the difference between undefined and explicit-false ownership semantics.

The production change is small: the PR reports a net addition of 12 lines across four existing production owners, with no public SDK, configuration, database schema, protocol, or compatibility changes.

## Real-Store Proof

The PR includes a real behavior proof using a physical SQLite store at `agents/main/agent/openclaw-agent.sqlite`, the actual session-backed memory corpus, and the dreaming projection.

The matrix covered Gateway agent runs, local CLI, admin `chat.send`, direct auto replies, collect, and durable overflow. It also tested external-user, inter-session, and internal-system provenance across owner and non-owner senders.

In the mixed-overflow case, a guest turn and an owner turn shared the same transport sender ID under a tiny queue cap. The resulting memory records kept the guest entry untrusted and the owner entry trusted, with no guest leak.

## Validation

Focused validation covered Gateway, CLI, queue, transcript-owner, and persistence tests for 362 passing cases. Existing ACP and direct-reply suites added six more, for 368 total passing tests.

For operators, the benefit is sharper long-term memory. OpenClaw can keep using durable memory across chats and automation, while reducing the chance that internal system text or non-owner input is remembered as the owner's own instruction.
