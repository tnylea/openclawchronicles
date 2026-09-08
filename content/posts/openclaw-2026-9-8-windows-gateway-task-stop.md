---
title: "OpenClaw Fixes Windows Gateway Task Stops"
excerpt: "OpenClaw now records Windows Gateway child failures and stops scheduled-task descendants cleanly, improving diagnostics and teardown for operators."
coverImage: '/assets/images/posts/openclaw-2026-9-8-windows-gateway-task-stop.png'
date: '2026-09-08T08:05:00.000Z'
dateFormatted: September 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-8-windows-gateway-task-stop.png'
---

OpenClaw has landed a Windows Gateway reliability fix for operators who run the service through Task Scheduler. [PR #141744](https://github.com/openclaw/openclaw/pull/141744), "fix(windows): stop Gateway task descendants and log child failures," merged on September 8, 2026 at 06:15 UTC.

The change addresses two related problems. A supervised Gateway could fail without leaving a useful child exit result or stderr trail, and ending the scheduled task could leave the actual Gateway process alive with ownership of its state directory.

That combination is painful in production because it hides the original failure and can make a follow-up start look like a separate lock or port problem.

## What Changed

The Windows supervisor now records the Gateway child exit code, signal, reason, and the last 8,192 stderr characters in the existing redacted Gateway log. The PR says this preserves both failure results and intentional zero exits while still discarding stdout.

The teardown side is more structural. Native investigation found that the Gateway was already inside a kill-on-close Job, but an anchor process held the handle. Task Scheduler could end WScript while the Node supervisor, anchor, and Gateway survived.

OpenClaw now validates and pins the original CMD/WScript ancestry, transfers the last non-inheritable handle of the outer kill-on-close Job to WScript, assigns itself, and closes its local copy before admitting a child. Ending WScript therefore ends the supervisor and descendants too.

## Why It Matters

Windows services often fail in ways that are hard to debug from a distance. When the scheduled task says it stopped but the Gateway keeps running, operators can be left chasing symptoms: an occupied port, a state directory still in use, or a restart that never becomes healthy.

This fix makes the scheduler boundary match operator intent. Ending the task should mean the Gateway stops. If the Gateway child failed earlier, the log should say why.

The PR also clarifies a Windows platform limit in documentation. Task Scheduler's `RestartOnFailure` policy can cover failed start conditions or action launches, but a nonzero exit from an already launched Gateway does not guarantee automatic recovery on the tested host.

## User Impact

The visible impact is better recovery and clearer diagnostics for Windows Gateway installs. Both `schtasks /end` and `Stop-ScheduledTask` are covered by the change, and the PR says a subsequent task start must create a new healthy process.

Existing installations need the refreshed launcher contract through a service refresh or `openclaw gateway install --force`. The change does not add a new dependency, configuration option, config schema, or SQLite storage format.

For administrators, the practical advice is simple: after updating, force-refresh the Windows Gateway scheduled task if you rely on Task Scheduler to manage OpenClaw.

## Validation

The maintainers validated the change on native Windows Server 2022 x64 with Node 24.20.0, isolated task-owned accounts, isolated state, and loopback ports. Windows 11 and ARM64 were not directly exercised.

The PR reports that raw `/End` extinguished all 10 recorded processes in one run, while `Stop-ScheduledTask` extinguished all nine recorded processes in another. Each case freed the port and allowed a fresh start.

Focused local tests passed with 183 passing cases and one platform-specific skip. The final exact-head CI run is also linked as green in the PR.
