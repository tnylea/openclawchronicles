---
title: "OpenClaw Cron Keeps Action Lines Visible"
excerpt: "OpenClaw fixed cron command jobs so login URLs, setup codes, and other action-required lines survive noisy output truncation."
coverImage: '/assets/images/posts/openclaw-2026-7-1-cron-action-required-output.png'
date: '2026-07-01T08:15:00.000Z'
dateFormatted: July 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-1-cron-action-required-output.png'
---

OpenClaw merged [PR #96393, "fix(cron): preserve action-required command output"](https://github.com/openclaw/openclaw/pull/96393) on July 1st, fixing a P1 cron reliability bug for command jobs that print the important line early and noisy logs later.

The bug is familiar to anyone who has run setup or device-login commands from automation. A command prints the URL, code, or next action near the start. Then it emits enough extra output to exceed the configured capture size. The final summary keeps only the tail, and the one line the operator needs is gone.

For OpenClaw cron jobs, that meant the run summary, run log, announce delivery, and completion webhook could lose the action-required line.

## What Changed

The fix adds an opt-in output preservation hook to `runCommandWithTimeout()`. Default exec capture behavior stays unchanged. Cron command jobs use the hook to preserve action-required lines even when `outputMaxBytes` keeps only the final tail of stdout and stderr.

Cron command summaries now get an `action-required output preserved:` block before the bounded captured tail. That gives operators a better recovery path without removing the existing truncation controls.

The PR keeps the scope narrow:

- Cron command jobs can preserve action-required lines
- Ordinary exec and tool calls keep the old tail-bound behavior unless they explicitly opt in
- Non-command cron summaries are unchanged
- Captured output and partial-line scanning remain bounded

## Security Boundary

The security side of this patch is just as important as the preservation behavior. Action-required lines can contain setup URLs, auth codes, device codes, tokens, or password-like assignments.

OpenClaw now keeps those lines where the operator needs them, but redacts them before external delivery. The PR says cron announce delivery, successful completion webhook payloads, completion webhook diagnostics entries, and `cron_changed` hook summaries use redacted command summaries.

Failed completion webhook payloads keep the stricter boundary: they omit `summary`, `diagnostics`, `job.state.lastDiagnosticSummary`, and `job.state.lastDiagnostics`.

That split is sensible. The operator-facing cron history needs enough detail to recover from a setup flow. External notifications should not spray raw login material into every downstream integration.

## Why This Matters for Operators

Cron is one of the places where OpenClaw becomes infrastructure rather than a chat assistant. Jobs may wake a session, check a service, refresh a login, call a deployment command, or run a maintenance task while the operator is away.

When those jobs need human action, the summary has to carry the actual instruction. Losing the first `Visit this URL and enter this code` line because a command later printed verbose logs turns automation into a scavenger hunt.

PR #96393 makes that failure mode much less likely while preserving the existing bounded-output model.

## Validation

The PR includes focused coverage across cron, process execution, gateway notifications, and hook delivery.

The reported real-behavior proof ran an actual cron command job with an early device-login-style line, a numeric verification code, a token assignment, and noisy tail output. It verified that the operator summary preserved the action line while the external delivery projection redacted the URL, raw code, and token value.

The proof log reports 91 focused tests passing across gateway, cron, and process shards. Additional tests cover preserved lines surviving tail truncation, long no-newline output staying bounded, summary prepending, URL/code/token redaction, successful webhook payload redaction, failed webhook omission behavior, and redacted `cron_changed` hook summaries.

## Bottom Line

OpenClaw cron command jobs now treat "what the operator must do next" as a first-class output class.

The fix does not simply keep more logs. It preserves actionable lines, keeps noisy tails bounded, and redacts sensitive setup material before external delivery. That is a practical improvement for unattended jobs, device login flows, setup tasks, and any cron automation where the useful instruction appears before the noise.
