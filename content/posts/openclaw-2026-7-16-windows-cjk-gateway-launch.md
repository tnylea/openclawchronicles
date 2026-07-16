---
title: "OpenClaw Fixes Windows CJK Gateway Launches"
excerpt: "OpenClaw now writes Windows gateway launchers in locale-safe encodings so CJK profile paths no longer break first-run startup."
coverImage: '/assets/images/posts/openclaw-2026-7-16-windows-cjk-gateway-launch.png'
date: '2026-07-16T08:01:00.000Z'
dateFormatted: July 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-16-windows-cjk-gateway-launch.png'
---

OpenClaw merged a Windows gateway startup fix this morning for users whose profile paths contain CJK characters. [PR #107751](https://github.com/openclaw/openclaw/pull/107751), `fix(daemon): gateway fails to launch on Windows when the profile path contains CJK characters`, merged at 07:42 UTC on July 16.

The PR closes issue #107416 and was labeled P0, with compatibility and availability risk. The affected path is easy to recognize: a Windows 11 user can install OpenClaw, but the gateway never starts because generated launcher scripts cannot resolve paths like `C:\Users\...` when those paths contain Chinese, Japanese, Korean, or Thai characters.

## What Broke

OpenClaw's Windows daemon writes launch helpers for the gateway, including `gateway.cmd`, a hidden `gateway.vbs`, and a Startup-folder fallback entry. Before this change, those files were written as UTF-8 without a byte-order mark.

That is a problem on Windows because `wscript.exe` and `cmd.exe` do not interpret those launcher formats the same way. The PR explains that `.vbs` is reliably read as ANSI or UTF-16 LE with a BOM, while `.cmd` is parsed through the console code page. Non-ASCII path bytes could be garbled, and the launch chain failed at the first hop.

For users, the failure looked like a first-run dead end: the install completed, a popup reported that Windows could not find the generated gateway script, and the Scheduled Task never launched the OpenClaw gateway.

## The Encoding Fix

The daemon now has a launcher encoding helper for each Windows launcher format. `.vbs` launchers are always written as UTF-16 LE with a BOM, the portable encoding for Windows Script Host.

For `.cmd` launchers, OpenClaw keeps ASCII content byte-identical, but encodes non-ASCII content with the system ANSI code page only on locales where that is a well-defined fix for the console path. The write path verifies that the encoded output can round-trip through the same decoder used by the read path, so an unmappable path fails clearly instead of writing a broken launcher.

The read path also improves repair behavior. It now detects UTF-16 BOMs first, tries strict UTF-8 for existing installs, then falls back to the Windows system encoding when needed. That lets OpenClaw parse and repair older launchers instead of assuming every machine has the same path encoding story.

## Why It Matters

This is not a cosmetic localization bug. If the gateway cannot start, OpenClaw cannot serve the local runtime, channel integrations, or node traffic that depend on it. A profile name should never decide whether the agent comes online.

The fix also shows why cross-platform automation needs to treat generated scripts as part of the product surface. Windows launcher files are small, but they sit directly in the boot path. Encoding mistakes there become availability bugs.

## Evidence

The PR reports focused tests for `.cmd`, `.vbs`, and Scheduled Task parsing behavior, plus existing Windows encoding tests. It also notes that `iconv-lite` was already present in the dependency tree and was promoted to a root dependency to handle the required Windows code-page encodings.

One sibling surface remains explicitly out of scope: the temporary restart `.cmd` written by the update-time restart path. The PR calls that out as a follow-up, which is useful context for operators watching Windows upgrade reliability.

## Operator Takeaway

Windows users with localized profile paths should see a more reliable first run once this lands in a release. If your gateway startup failure looked like a missing generated `gateway.vbs` or a Scheduled Task that never really launched, this is the fix to watch.

For OpenClaw overall, the important lesson is simple: the gateway launch path is infrastructure, and infrastructure has to handle real user names, real locales, and real filesystem paths.
