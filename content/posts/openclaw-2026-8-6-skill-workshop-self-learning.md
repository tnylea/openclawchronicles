---
title: "OpenClaw Tightens Skill Workshop Learning"
excerpt: "OpenClaw PR #119818 removes regex-based Skill Workshop self-learning so durable corrections go through reviewer-authored proposals."
coverImage: '/assets/images/posts/openclaw-2026-8-6-skill-workshop-self-learning.png'
date: '2026-08-06T08:03:00.000Z'
dateFormatted: August 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-6-skill-workshop-self-learning.png'
---

OpenClaw merged [PR #119818, "fix(skills): remove regex correction capture; self-learning is reviewer-only"](https://github.com/openclaw/openclaw/pull/119818), a P1 Skill Workshop fix for autonomous learning quality.

The problem was a deterministic proposal generator wired into the agent-end hook. It scanned raw user chat text for durable-instruction phrases and correction patterns, then templated matches directly into Skill Workshop proposals.

That sounds useful in theory. In practice, the PR says the regex path produced malformed live proposals from ordinary correction language. A phrase like "I told you" could trip the explicit-correction branch, skip the grammar gate, and turn a message fragment into a proposed procedure.

Skill Workshop is powerful because skills are durable. That also means low-quality capture is dangerous. A bad one-off interpretation can become standing behavior if the proposal path is too eager.

## Reviewer-Only Proposal Generation

PR #119818 deletes the regex-based capture path entirely. Autonomous proposals now flow through the isolated LLM experience reviewer instead of string-matching raw chat.

The reviewer prompt still treats durable corrections as first-class evidence. Phrases such as "from now on," "always," or "never" can still become skill improvements, but they must be restated as procedure steps against the Workshop authoring standards.

That distinction matters. The system can learn from corrections without copying a fragment of a frustrated chat message into a live `SKILL.md`.

The PR also removes pending-suggestion session machinery whose only producer was the deleted path, including `pendingSkillSuggestion`, `skillCaptureSignalHashes`, and the suggestion nudge.

## Why This Is A Good Guardrail

Durable agent behavior should have a higher bar than transient chat interpretation. A regex can identify that something might be a correction, but it cannot reliably decide whether the correction belongs in a reusable skill, how broad it should be, or what verification step would prove it.

The reviewer path is better suited to that job because it can evaluate context, rewrite the lesson as a reusable procedure, and avoid verbatim capture of incidental text.

For operators, the practical result is less surprise. Skill Workshop remains capable of self-improvement, but autonomous learning now runs through one authoring boundary instead of two competing proposal generators.

## Evidence

The PR adds `agent-end-side-effects.no-verbatim-capture.test.ts`, which feeds representative junk-producing messages through `awaitAgentEndSideEffects` and asserts that no proposal is created. On the unmodified main branch, the test reproduces the bug by producing a proposal from message-fragment text.

The reported fix is intentionally direct: remove the bad capture path, keep reviewer-authored learning, and prevent raw correction snippets from becoming durable skill procedures.

