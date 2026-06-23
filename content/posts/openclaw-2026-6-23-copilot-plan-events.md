---
title: "OpenClaw Brings Copilot Plan Events Into View"
excerpt: "OpenClaw now mirrors Copilot plan notifications and native subagent lifecycle events into the same streams used by Codex."
coverImage: '/assets/images/posts/openclaw-2026-6-23-copilot-plan-events.png'
date: '2026-06-23T23:02:00.000Z'
dateFormatted: June 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-23-copilot-plan-events.png'
---

OpenClaw merged [PR #96062](https://github.com/openclaw/openclaw/pull/96062), giving Copilot-backed sessions better visibility into native plan updates and subagent lifecycle events.

The change is part of a larger pattern in OpenClaw's provider work: different coding harnesses should feel consistent once they are inside the OpenClaw runtime. Codex already exposes plan updates through the generic event stream. Copilot sessions had native plan and child-task events available, but the OpenClaw adapter was dropping them.

## What Users Gain

The immediate improvement is observability. Copilot plan notifications now route through the same `stream: "plan"` contract used by Codex, so UIs and runtime consumers can watch what the agent is planning instead of seeing a quieter session with less structure.

The PR also mirrors native Copilot subagent lifecycle events into OpenClaw's existing scoped task runtime. That gives child work a place in task state and ensures cleanup happens on completion, failure, abort, or teardown.

In practical terms, Copilot sessions should now be easier to inspect while they are working:

- Plan updates can appear in the generic agent-event stream.
- Native subagents can be represented as scoped tasks.
- Terminal states clean up task tracking instead of leaving stale child work behind.
- The harness contract stays unchanged for callers.

The PR deliberately leaves child completion announcements out until the SDK provides a reliable child-result payload. BYOK mapping is also left as a follow-up. That restraint keeps this patch focused on event visibility instead of guessing at data the underlying SDK cannot yet guarantee.

## Why This Matters

OpenClaw is no longer just one model path with one event vocabulary. The runtime increasingly has to normalize sessions across Codex, Copilot, local providers, mobile clients, chat gateways, and plugin surfaces.

That normalization is not cosmetic. Planning events and subagent state are how operators understand what an autonomous run is doing. They are also how control surfaces avoid treating a complex multi-step run as a silent blob of work.

Copilot support becomes more useful when it can speak the same operational language as Codex:

- What is the agent planning?
- Did it spawn child work?
- Is that child work still active?
- Did the child task complete, fail, or get aborted?

PR #96062 answers more of those questions through existing OpenClaw streams instead of inventing a Copilot-only path.

## Proof And Scope

The author reports 148 passing focused tests across Copilot event bridge, native subagent task mirroring, and attempt handling. Formatting and diff checks passed, and an autoreview run found no accepted actionable findings.

For users, this is a visibility upgrade rather than a new command. Copilot-backed OpenClaw runs should now look more like first-class runtime citizens when they emit plans and delegate work.
