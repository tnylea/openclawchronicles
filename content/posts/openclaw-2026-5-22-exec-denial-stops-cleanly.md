---
title: "OpenClaw Denied Exec Approvals Now Stop the Agent Cleanly"
excerpt: "A P1 fix merged today makes denied exec approvals terminal in OpenClaw, stopping agent loops for good and adding Chinese abort triggers."
coverImage: '/assets/images/posts/openclaw-2026-5-22-exec-denial-stops-cleanly.webp'
date: '2026-05-22T08:00:00.000Z'
dateFormatted: May 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-22-exec-denial-stops-cleanly.webp'
---

If you've ever denied an exec approval in OpenClaw and watched the agent keep going anyway — that bug is fixed.

[PR #85194](https://github.com/openclaw/openclaw/pull/85194), merged into `main` this morning by contributor [@samzong](https://github.com/samzong), makes denied exec approvals **terminal**. The agent stops, sends a brief denial notice to the originating channel if a delivery route exists, and does not resume. No more denial loops. No more follow-up turns sneaking through after you said no.

## What Was Happening Before

When a user rejected an exec approval, OpenClaw was routing the denial through the normal agent followup path. That meant the agent could — and sometimes would — continue running after being told no. This is exactly the kind of footgun the community has been asking the team to close off.

The underlying cause was inside `src/agents/bash-tools.exec-approval-followup.ts`: denial text was only suppressed for subagent and cron sessions. For ordinary user sessions, the code fell straight into the normal agent followup path. Node `exec.denied` events were also being enqueued with heartbeat wakeups, which could re-trigger agent activity after the denial.

## What Changed

The fix is precise and fail-closed:

- **Denied approval results are now terminal.** The agent skips resume entirely and attempts a concise direct delivery notice to the operator or originating chat route only.
- **Node `exec.denied` events are suppressed.** The event is authorized and then dropped before system-event enqueue or heartbeat delivery, so no phantom wakeups fire downstream.
- **Chinese abort triggers added.** The PR extends the abort-trigger language list to include Chinese-language deny phrases, improving accessibility for international users.
- **Docs updated.** The official [exec approvals documentation](https://docs.openclaw.ai/tools/exec-approvals) now reflects the new behavior and contract.

## Why This Matters

Exec approvals are one of OpenClaw's core safety primitives. If denying an approval doesn't reliably stop the agent, the whole mechanism loses credibility. This fix restores the contract: when you say no, the agent stops.

The change is rated **P1** — the team treated this as a priority fix, not a nice-to-have. It ships with a focused set of tests covering the denial path, heartbeat suppression, and direct-delivery fallback.

## Compatibility Note

There's one breaking behavior change to be aware of: external node clients watching for `exec.denied` session events will no longer receive them. The event now fails closed — authorized, then dropped. If your setup or tooling depends on that signal, consult the updated docs for the new approach.

## Getting the Fix

PR #85194 is merged into `main` as of today and will ship in the next tagged release. If you're on a nightly or rolling build, you'll pick it up automatically. Otherwise watch for it in the upcoming `v2026.5.x` drop.
