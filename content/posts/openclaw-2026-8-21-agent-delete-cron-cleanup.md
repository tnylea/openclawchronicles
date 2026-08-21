---
title: "OpenClaw Agent Deletes Now Clean Up Cron Jobs"
excerpt: "OpenClaw fixed the offline agent deletion path so scheduled jobs for removed agents are cleaned up, with warnings when Gateway credentials block cleanup."
coverImage: '/assets/images/posts/openclaw-2026-8-21-agent-delete-cron-cleanup.png'
date: '2026-08-21T08:02:00.000Z'
dateFormatted: August 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-21-agent-delete-cron-cleanup.png'
---

OpenClaw merged another cron-adjacent reliability fix this morning: [PR #127075](https://github.com/openclaw/openclaw/pull/127075) makes the offline agent deletion path clean up scheduled jobs for the deleted agent.

The bug lived in a fallback path. When `agents delete` could reach the Gateway, the Gateway-owned path removed both exec approvals and cron jobs transactionally around the roster update. But when the Gateway was unavailable and the CLI used the local deletion path, it only performed the exec-approval half of that cleanup.

The result was an orphaned scheduled job tied to an agent that no longer existed.

## The User-Facing Failure

The PR is careful about severity. This was not a silent successful execution bug. If an orphaned job fired, OpenClaw recorded an error saying the cron job's agent was unavailable, and `cron list` showed the job in an error state.

The defect was persistence: the stale job stayed scheduled forever and the delete command did not mention it. The sharper risk was agent ID reuse. If an operator later recreated an agent with the same ID, the orphaned job could begin running against that new agent.

## What Changed

The implementation now distinguishes two different Gateway failure modes that used to collapse into the same result:

- The Gateway is unreachable.
- The Gateway is reachable in principle, but credentials cannot be resolved.

Those cases have different ownership implications. If the Gateway is unreachable, the CLI can safely mutate the local cron store as part of offline deletion. If credentials fail, there may still be a live scheduler that owns the store, so OpenClaw completes the roster deletion but warns that cron cleanup was skipped.

The offline cleanup now mirrors Gateway ordering: cron cleanup wraps exec-approval cleanup, which wraps the roster commit. The existing non-Gateway cron removal logic was moved into a shared local service instead of creating a second mutation path.

## Operator Impact

For day-to-day use, the fix makes agent deletion match operator expectations:

- Deleting an agent while no Gateway is running removes that agent's scheduled jobs.
- Other agents' jobs are left untouched.
- Built-in ambient jobs survive the deletion and Gateway restart flow.
- Credential-blocked cleanup is now explicit instead of looking like a fully clean delete.

The PR also updates `docs/cli/agents.md` to document both branches, which matters for automation operators who rely on CLI output and JSON fields.

## Validation

The proof included isolated live before-and-after checks against the `cron_jobs` table, confirming the deleted agent's job was removed while another agent's job and built-in jobs survived.

Focused tests for agent deletion, local request context, and exec approval storage passed after rebase. The worker's broader sweep also covered cron transactional operations, Gateway agent mutations, lazy cron contracts, CLI registration, Gateway config patching, and tooling fixtures. A full build passed, and changed-file checks covered docs, links, linting, typechecking, import cycles, and database-first guards.

## Bottom Line

[PR #127075](https://github.com/openclaw/openclaw/pull/127075) closes a lifecycle gap between the Gateway and offline CLI paths. Agent deletion is now cleaner, cron state is less likely to drift, and risky ambiguous cleanup cases are surfaced to the operator instead of being hidden behind a success message.
