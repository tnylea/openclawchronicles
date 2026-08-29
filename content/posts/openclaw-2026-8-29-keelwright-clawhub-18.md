---
title: "OpenClaw Skill Spotlight: Keelwright 1.8"
excerpt: "Keelwright 1.8 leads the latest ClawHub updates with audit fixes for AI-generated code review, loop coding, model pins, and runtime bindings."
coverImage: '/assets/images/posts/openclaw-2026-8-29-keelwright-clawhub-18.png'
date: '2026-08-29T23:07:00.000Z'
dateFormatted: August 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-29-keelwright-clawhub-18.png'
---

ClawHub's latest active feed is led by [Keelwright](https://clawhub.ai/skills/skills/keelwright), a skill aimed at developers who ship AI-generated code but cannot manually read every line at full depth.

The ClawHub API lists Keelwright's latest version as `1.8.0`, with an update created on August 29, 2026. The changelog describes "Wave 2 audit fixes" across active verification, redaction, advisory severity, breaker behavior, model pinning, and runtime bindings for Cursor, Codex, Cline, and OpenClaw.

## What Keelwright Is For

Keelwright positions itself as an audit engine for vibe-coding and loop-coding workflows. Its summary says it covers 28 known failure modes in AI-generated code, including SQL injection, hardcoded secrets, hallucinated packages, deleted tests, runaway token burn, false completion reports, missing authorization, business-logic bypasses, and over-engineering.

That list maps neatly to the messy reality of agent-assisted software work. The problem is not only that models can make mistakes. It is that they can make plausible mistakes while reporting confidence, passing shallow checks, or moving too quickly for a human reviewer to reconstruct every decision.

Keelwright's pitch is that most failure modes get a machine-enforced detector plus a discipline rule the agent must follow. A few modes remain discipline-only, which is a useful admission: not every review concern can be reduced to a reliable scanner.

## The 1.8.0 Update

The latest changelog is compact but dense. It calls out:

- T11 active-after-verify behavior.
- T13 userinfo redaction.
- T14 medium advisory handling.
- T15 `breaker.py`.
- T16 model pinning.
- F29 Cursor, Codex, Cline, and OpenClaw bindings.
- More honest framing and runtime-agnostic guidance.

For OpenClaw users, the runtime-binding note is the headline. Skills that work cleanly across agent runtimes are more useful when teams mix tools, or when a single workflow moves between local development, hosted agents, and scheduled automation.

## Why This Skill Is Worth Watching

OpenClaw's ecosystem has been steadily moving from novelty skills toward operational skills: review, diagnostics, verification, documentation, and repeatable workflow control.

Keelwright sits in that operational category. It is not a weather lookup or a thin wrapper around one API. It is trying to formalize the review behavior around AI-written code, including the awkward parts where a human cannot afford to inspect everything but also cannot responsibly trust everything.

The ClawHub listing reports 31 versions, more than 1,200 downloads, and the latest tag at `1.8.0`. That does not prove quality by itself, but it does show active iteration.

## The Bottom Line

The most interesting part of Keelwright is its framing: AI-assisted coding needs review procedures that are explicit enough for agents to follow and concrete enough for humans to audit.

Version 1.8.0 appears to tighten that story with better redaction, advisory handling, model pinning, and multi-runtime bindings. For teams using OpenClaw in autonomous or semi-autonomous coding loops, Keelwright is a ClawHub skill to keep on the radar.
