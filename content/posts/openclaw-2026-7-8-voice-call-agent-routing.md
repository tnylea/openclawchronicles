---
title: "OpenClaw Preserves Voice Call Agent Routing"
excerpt: "OpenClaw voice and Google Meet sessions now keep the invoking agent fixed across Gateway and realtime call paths."
coverImage: '/assets/images/posts/openclaw-2026-7-8-voice-call-agent-routing.png'
date: '2026-07-08T08:20:00.000Z'
dateFormatted: July 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-8-voice-call-agent-routing.png'
---

OpenClaw merged [PR #77763, "fix(voice-call): preserve per-call agent routing"](https://github.com/openclaw/openclaw/pull/77763), a P1 routing fix for Google Meet and direct Voice Call sessions in multi-agent installations.

The bug was subtle but serious: a call could lose the invoking agent at tool and Gateway boundaries. That meant voice sessions could speak, transcribe, or consult as the configured default agent instead of the agent that actually started the call.

## What Changed

Agent identity is now resolved once when a call is created and frozen on the call record. Response generation, realtime instructions, realtime consults, Google Meet transports, and Voice Call actions all consume that same canonical identity.

For Google Meet, the PR uses a constrained trusted in-process Gateway runtime for per-agent dispatch. The PR also draws a clear boundary around spoofing and ambiguity:

- External callers cannot spoof `agentId`.
- Explicit remote Gateway URLs remain authoritative.
- Ambiguous non-default-agent remote or standalone routing fails closed.
- Main-agent and explicitly configured remote Gateway behavior remains supported.

The important part is that OpenClaw now prefers an actionable routing error over silently falling back to the wrong agent.

## Why It Matters

Voice and meeting integrations are high-context surfaces. They can involve live conversation, transcription, realtime instructions, and tool-backed consultation. In a multi-agent setup, the difference between "the agent that started this call" and "the default agent" can be the difference between the right workspace, memory, permissions, and persona.

If a call leaks into the default agent, the user may hear an answer from the wrong context. In the worst case, the wrong agent could consult data or tools that were not intended for that call.

This PR treats per-call agent identity as session state that must survive the whole route, not a hint that can be recomputed differently in each layer.

## User Impact

For operators running multiple agents, concurrent users should now hear and consult with the agent that initiated each call. Google Meet Chrome, Chrome-node, and Voice Call transports should preserve the same agent for the full session.

Misconfigured non-default-agent routing should produce a clearer error instead of quietly crossing into another agent's context.

## Validation

The PR reports a focused Blacksmith Testbox suite with 323 tests passing across Gateway, plugin registry, Voice Call, and Google Meet. It also reports `pnpm check:changed`, a full `pnpm build`, and a fresh structured autoreview with no accepted actionable findings.

The hosted proof is linked from the PR at [GitHub Actions run 28870210067](https://github.com/openclaw/openclaw/actions/runs/28870210067).

## Bottom Line

OpenClaw voice sessions now have a stronger identity boundary. Calls should stay attached to the agent that created them, and uncertain routes should fail visibly instead of borrowing the default agent.
