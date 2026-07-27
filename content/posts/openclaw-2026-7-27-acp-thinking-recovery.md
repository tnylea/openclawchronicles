---
title: "OpenClaw Keeps ACP Turns Alive on Thinking Errors"
excerpt: "OpenClaw fixed ACP dispatch so unsupported thinking values no longer kill entire turns for non-Codex agent backends."
coverImage: '/assets/images/posts/openclaw-2026-7-27-acp-thinking-recovery.png'
date: '2026-07-27T08:15:00.000Z'
dateFormatted: July 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-27-acp-thinking-recovery.png'
---

OpenClaw merged a P1 ACP reliability fix this morning in [PR #113935, "fix(acp): keep ACP turns alive when a backend rejects the requested thinking level"](https://github.com/openclaw/openclaw/pull/113935). The bug was subtle but painful: an optional tuning setting could kill the entire turn when a non-Codex backend rejected a thinking value it did not understand.

The affected path involved ACP sessions where OpenClaw carried `thinking=off` or `thinking=minimal`. OpenClaw's thinking vocabulary includes `off`, `minimal`, `low`, `medium`, and `high`. The PR notes that `claude-agent-acp` advertises an `effort` option with `default`, `low`, `medium`, `high`, `xhigh`, and `max`. That vocabulary mismatch meant two ordinary OpenClaw values could be rejected before the first turn began.

## What Changed

OpenClaw already treated thinking as optional. If a backend did not advertise the relevant control at all, the runtime skipped it and kept the turn alive. The missing case was an advertised control that rejected a specific value.

PR #113935 adds a broader rejection matcher for thinking config options. Instead of only checking for OpenClaw's own unsupported-control code, the control path now recognizes backend invalid-value responses for thinking and skips that optional setting.

The scope is deliberately narrow:

- Explicit user commands still report backend rejections.
- Required controls such as model selection still fail the turn when rejected.
- Genuine runtime failures on a thinking key still fail the turn.
- Accepted thinking values still reach the backend.
- The behavior is backend-agnostic, covering non-Codex ACP backends beyond Claude.

That keeps the fix from becoming a silent error-swallowing path. It only changes the behavior for optional thinking controls during turn setup.

## Why It Matters

ACP dispatch is supposed to let OpenClaw route work through external agent backends without making every backend share the same feature vocabulary. Optional controls are where that compatibility contract gets tested.

Before this patch, a user or operator could set a normal OpenClaw thinking preference and accidentally make every turn fail on a backend that used a different enum. That is the wrong failure mode. The backend did not reject the task, the model, or the session. It rejected one optional tuning value.

After the fix, the turn continues with the backend's existing effort setting when `off` or `minimal` is rejected. Values the backend accepts, such as `low`, still apply normally.

## The Verification Trail

The PR includes real before-and-after evidence against the production `applyManagerRuntimeControls` path, driving the real `@openclaw/acpx` runtime and `claude-agent-acp` 0.55.0 over stdio. Before the patch, `thinking=off` and `thinking=minimal` failed setup with an invalid effort error. After the patch, the session stayed usable and the backend effort remained unchanged.

The control case is important too: `thinking=low` still changed backend effort from `high` to `low` before and after. That shows the guard does not suppress working controls.

Validation included focused runtime config tests, neighboring optional-timeout and required-control tests, lint, formatting, and TypeScript checks.

## Bottom Line

[PR #113935](https://github.com/openclaw/openclaw/pull/113935) fixes a sharp edge in ACP interoperability. OpenClaw can keep a turn alive when a backend rejects an optional thinking value, while still surfacing explicit user-command errors and preserving required-control failures.

For teams using Claude, OpenCode, Gemini, or other ACP-compatible agents behind OpenClaw, this should make cross-backend dispatch more forgiving without weakening the runtime contract.
