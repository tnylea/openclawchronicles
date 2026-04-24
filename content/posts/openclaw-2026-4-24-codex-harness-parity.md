---
title: "OpenClaw Codex Harness Gets Full Hook and Logging Parity with Pi"
excerpt: "Three PRs merged today bring OpenClaw's Codex harness in line with Pi: agent event hooks, unified verbose tool logs, and OTel trace context on diagnostics."
coverImage: '/assets/images/posts/openclaw-2026-4-24-codex-harness-parity.png'
date: '2026-04-24T08:00:00.000Z'
dateFormatted: April 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-24-codex-harness-parity.png'
---

Three pull requests merged into OpenClaw's `main` branch this morning quietly close a long-standing gap: the Codex harness now behaves much more like Pi when it comes to lifecycle hooks, verbose tool logging, and diagnostics tracing.

## What Changed

### Codex Hook Notifications Projected Into Agent Events (PR #70969)

Contributed by [@pashpashpash](https://github.com/pashpashpash), this change routes Codex app-server notification events through OpenClaw's unified agent event pipeline. Previously, notification-style events fired inside Codex sessions were invisible to the broader event system — they didn't trigger the same hooks or downstream integrations that equivalent Pi events would.

After this merge, Codex session notifications surface as first-class agent events. That means any plugin or integration listening for `llm_output`, `agent_end`, or similar lifecycle signals will now receive them from Codex-backed sessions, not just Pi ones.

The practical benefit: channel plugins, webhooks, and custom automation built on OpenClaw's agent event hooks will work consistently regardless of whether the underlying runner is Pi or Codex.

### Codex Verbose Tool Logs Now Match Pi Format (PR #70966)

Contributed by [@jalehman](https://github.com/jalehman), this fix ensures that when Codex runs tools in verbose mode, the log output format matches what Pi produces. The mismatch was purely cosmetic but caused real friction: developers debugging sessions would see inconsistent log shapes depending on which runner fired the tool call, making it harder to correlate behavior across a mixed Pi/Codex setup.

With the fix landed, verbose tool logs from both harnesses share the same structure — easier to grep, easier to parse, and easier to feed into external log aggregators.

### OTel Trace Context Attached to Diagnostic Logs (PR #70961)

The third PR adds OpenTelemetry trace context to OpenClaw's gateway diagnostic logs. If you're running OpenClaw in a setup that ships logs to an OTel-compatible collector (Grafana, Honeycomb, Datadog, etc.), trace IDs and span context will now be present on log lines emitted during agent runs.

This is a smaller change in scope but meaningful for anyone running OpenClaw at scale or as part of a larger observability stack. Correlating a slow agent turn with distributed trace data just got significantly easier.

## Why This Matters

The Codex harness has been a second-class citizen compared to Pi in OpenClaw's hook infrastructure for a while. The additions in v2026.4.22 last week ([Codex tool_result middleware](https://github.com/openclaw/openclaw/releases/tag/v2026.4.22), hook lifecycle alignment) started closing that gap at the plugin layer. Today's merges push the parity further into the event system, logging surface, and observability layer.

If you're building integrations on top of OpenClaw's agent event API, this week's work on `main` is worth watching. The `next` release tag should pick these up shortly.

## What's Next on `main`

The commit queue also shows a pending change to move Bonjour discovery into a bundled plugin — another architectural cleanup that shifts device-discovery concerns out of core and into the plugin layer. That one isn't merged yet but appears to be progressing alongside the Codex work.

Keep an eye on the [OpenClaw releases page](https://github.com/openclaw/openclaw/releases) for when these land in the next tagged release.
