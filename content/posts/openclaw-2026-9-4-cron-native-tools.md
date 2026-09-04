---
title: "OpenClaw Cron Jobs Keep Native Tools"
excerpt: "OpenClaw now preserves creator-approved native read and exec tools for scheduled jobs, fixing a silent capability loss in Codex and Claude automations."
coverImage: '/assets/images/posts/openclaw-2026-9-4-cron-native-tools.png'
date: '2026-09-04T08:05:00.000Z'
dateFormatted: September 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-4-cron-native-tools.png'
---

OpenClaw's morning batch includes a meaningful automation fix: scheduled jobs created from native Codex or Claude turns now retain the creator-approved tools they were supposed to inherit.

The change landed in [PR #137832](https://github.com/openclaw/openclaw/pull/137832), titled "fix(cron): retain native creator tools in scheduled jobs." The issue was straightforward but nasty: a creator turn could be allowed to read a file, create an automation that needed the same read, and still persist that job with an empty tool allowance. The scheduled run then failed later, detached from the moment where the user had already granted the capability.

## What Changed

The PR wires native tool facts into the existing final capture path for cron-created automations. For Claude, OpenClaw now observes the admitted parent turn's initialized tool list and intersects it with host selection. For Codex, the system contributes only the native `read` and `exec` tools when native code mode is enabled and `features.shell_tool` is explicitly pinned.

That narrow mapping matters. The PR does not infer broader authority such as write, edit, patch, process control, notebook cells, glob expansion, or node-native tools. The fix is about preserving the native tools the creator turn actually had, not upgrading scheduled jobs into a wider execution environment.

The implementation also handles lifecycle timing. Initialization starts in a pending state, calls reject visibly until the necessary tool fact arrives, and publication is bound to the exact active admission and capture. Warm turns cannot reuse old observations.

## Why It Matters

Scheduled OpenClaw jobs are often used for exactly the kind of work that needs local context: reading project files, checking generated artifacts, summarizing logs, and running small commands. When a job silently lost `read` or `exec`, the failure could look like a bad automation prompt instead of an authority handoff bug.

After the fix:

- New automations keep the native capabilities their creator had.
- Native-disabled creators still persist empty caps.
- Codex managed shell denials reject the creator before a job exists.
- Existing jobs with empty caps remain restricted.

That last point is deliberate. OpenClaw cannot safely migrate old empty caps, because an empty allowance may have been intentional. Users need to recreate or edit those jobs from a fresh authorized creator turn.

## Evidence From The PR

The PR body reports live tests across Claude and Codex native modes, native-disabled modes, managed-policy denial, and an endpoint-switch restart check. Positive scheduled runs replaced the target file with a fresh sentinel after the job was persisted and before execution, then verified that the scheduled job read the new value. That rules out cached creator output masquerading as authority preservation.

The final merged commit is `82d2c992a25bc38336e1a5d49e1ef15d03798f19`, merged at 07:13 UTC on September 4, 2026. The post-merge state is especially relevant for operators using OpenClaw cron jobs from Codex or Claude: recreate any automation that was created before this fix if it unexpectedly persisted with no native tools.

