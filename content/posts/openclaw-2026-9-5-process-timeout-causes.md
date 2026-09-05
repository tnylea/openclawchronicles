---
title: "OpenClaw Shows Process Timeout Causes In Lists"
excerpt: "OpenClaw process lists now show whether background commands ended from overall timeout or no-output timeout without extra polling."
coverImage: '/assets/images/posts/openclaw-2026-9-5-process-timeout-causes.png'
date: '2026-09-05T08:30:00.000Z'
dateFormatted: September 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-5-process-timeout-causes.png'
---

OpenClaw has merged a small but useful improvement for agents that manage background commands. [PR #133318](https://github.com/openclaw/openclaw/pull/133318), "feat(process): show timeout causes in list," landed at 07:45 UTC on September 5, 2026.

Before this change, `process list` could lose the canonical termination reason for a finished background command. A command that timed out might appear as a generic failed or signal result, even though the process registry still retained the reason and `process poll` already exposed it.

That forced agents into an awkward extra step. To decide whether a failed process needed a retry, a longer timeout, or deeper investigation, they often had to poll each failed session individually.

## What Changed

The fix makes the list path reuse OpenClaw's existing `finishedSessionDetails` projection, the same canonical helper already used by poll. The process registry remains the owner of `exitReason` and `noOutputTimedOut`.

The visible change is a timeout marker in model-visible list rows. A background command that previously looked like a generic failure can now show a cause such as `overall-timeout` directly in the list output.

The PR says this does not add a new tool action, schema, config option, timeout policy, or persistence path. Execution, timeout, cancellation, retention, storage, and permission behavior remain unchanged.

## Better Triage For Agents

This is one of those improvements that is small in code but valuable in daily operation. Agents often launch commands that may run for a while: builds, tests, imports, media jobs, or diagnostic scripts. When several are active or recently completed, the list view is the dashboard.

With the new timeout cause surfaced in that dashboard, agents can distinguish:

- overall timeout
- no-output timeout
- ordinary non-zero exit
- successful exit
- manual cancellation

That saves needless polling and makes retry decisions cleaner. A no-output timeout may point to a hung process or quiet long-running command. An overall timeout suggests the command simply exceeded its allowed wall time. A normal non-zero exit points somewhere else entirely.

## Evidence From The PR

The PR includes a before-and-after readback from the production registry and process tool path. At the exact base, a session marked with `overall-timeout` appeared in `process list` as a generic failed command, while `process poll` returned `exitReason`, `timedOut`, and `noOutputTimedOut`.

At the fixed head, the same production readback showed the list row with an `overall-timeout` marker, and the list details contained the same canonical timeout fields as poll. The terminal-state matrix also verified that normal non-zero exits and manual cancellation are not mislabeled as timeouts, and that listing does not consume the completion receipt.

Validation included 39 focused process timeout tests, `git diff --check`, and a fresh structured autoreview that reported no accepted or actionable findings. The production patch is intentionally narrow: 9 added and 3 removed lines in `src/agents/bash-tools.process.ts`, with focused test coverage in the process timeout suite.

For users, the headline is simple: OpenClaw background process lists now tell agents why a command timed out at the point they are already checking.
