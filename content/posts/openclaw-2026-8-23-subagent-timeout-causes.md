---
title: "OpenClaw Restores Subagent Timeout Causes"
excerpt: "OpenClaw parent agents now see the real failure cause when a subagent error was previously flattened into a generic timeout."
coverImage: '/assets/images/posts/openclaw-2026-8-23-subagent-timeout-causes.png'
date: '2026-08-23T23:01:00.000Z'
dateFormatted: August 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-23-subagent-timeout-causes.png'
---

OpenClaw merged a high-priority agent-runtime fix in [PR #125357](https://github.com/openclaw/openclaw/pull/125357), restoring failure causes when subagent errors are reported through the pending-error timeout path.

The bug was easy to miss because the status looked legitimate. A child agent could fail inside the lifecycle error retry grace window, and the parent would receive a timeout result. But that wait result already carried both the failure text and a `pendingError` flag. The announce path rebuilt it as a plain timeout anyway, dropping the useful cause.

For a parent agent, that distinction is not cosmetic. A genuine budget timeout suggests retrying with a narrower task or reporting that the child ran out of time. A runtime fault, provider failure, or malformed tool-call path points somewhere else entirely. Without the cause, the parent can neither recover well nor explain the real blocker to the user.

## What Changed

The fix is narrow. In `subagent-announce-output.ts`, the timeout branch now preserves `terminalOutcome.error` or the wait error only when `wait.pendingError === true`. Genuine budget timeouts keep the existing plain `timed out` label.

The user-visible internal status label now has room for the recovered cause:

- budget timeout: `timed out`;
- pending-error timeout: `timed out: <cause>`;
- failure: `failed: <cause>`;
- success: `completed; ready for parent review`.

The PR also caps the status label before it enters parent-agent prompt context. That matters because failure text can come from providers or lifecycle paths, and previously the child result was bounded while the status line itself could grow without a shared cap. The implementation reuses OpenClaw's UTF-16-safe truncation helper, so it does not split emoji or other astral characters at the boundary.

## Why It Matters

Subagents are most useful when the parent can treat their result as reliable evidence. A vague timeout is almost the opposite: it blurs whether the task was too large, the runtime failed, or the provider returned an actionable error.

[PR #125357](https://github.com/openclaw/openclaw/pull/125357) improves that contract without changing ordinary timeout behavior. It simply keeps the cause when the runtime already knows the timeout is standing in for a pending error.

That should make multi-agent work easier to diagnose in long-running tasks, especially where child sessions run out of process and the parent learns about them through `agent.wait`.

## Validation

The PR includes unit coverage for three projection cases: pending-error timeouts keep the cause, budget timeouts do not gain one, and timeout error text without `pendingError` is ignored. It also tests that the formatted announce message includes the new `timed out: <cause>` label.

Runtime evidence was produced against a real gateway and real HTTP model endpoints. The PR also reports clean production and test type lanes, lint, formatting, dead-code, architecture, max-lines, Plugin SDK declaration, docs, and protocol checks.

## Bottom Line

OpenClaw parent agents now get a more faithful subagent completion signal. When a child actually fails, the parent can see the cause instead of being left with a misleading generic timeout.
