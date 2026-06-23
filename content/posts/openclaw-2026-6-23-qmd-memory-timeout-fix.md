---
title: "OpenClaw Kills Orphaned QMD Memory Searches"
excerpt: "OpenClaw now aborts QMD memory search subprocesses when memory_search times out, preventing hidden CPU and memory leaks."
coverImage: '/assets/images/posts/openclaw-2026-6-23-qmd-memory-timeout-fix.png'
date: '2026-06-23T23:01:00.000Z'
dateFormatted: June 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-23-qmd-memory-timeout-fix.png'
---

OpenClaw merged [PR #93394](https://github.com/openclaw/openclaw/pull/93394), a memory-system reliability fix that makes the QMD backend honor `memory_search` aborts all the way down to the spawned subprocess.

The user-facing symptom was easy to miss. `memory_search` already had a 15-second deadline, so the agent would stop waiting and move on. But when the QMD backend was active, that deadline only stopped the caller. The underlying `qmd query` or `qmd search` process could keep running until QMD's own command timeout expired.

That timeout can be much longer than the tool deadline. The PR notes that the embed-heavy default had been raised to 600 seconds, which means a timed-out search could leave work running for roughly ten minutes after the agent had already abandoned it.

## The Leak Behind The Timeout

Timeouts are only useful when they cancel the work they are timing.

Earlier OpenClaw work had fixed this orphaned-work problem for the builtin memory backend by threading an `AbortSignal` through `MemorySearchManager.search()`. The QMD manager sat behind the same interface, but it did not actually pass that signal into the process layer. That left QMD users with a hidden resource leak:

- The agent deadline fired.
- The caller saw `memory_search timed out after 15s`.
- The spawned QMD process kept consuming CPU and memory.
- Repeated timeouts could stack up multiple abandoned searches.

PR #93394 closes that gap for the QMD backend and the grouped collection-search path.

## What Changed

The change wires the abort signal through the QMD search manager, the grouped collection search path, and the shared CLI process runner that launches QMD. If the caller's deadline fires, the subprocess is killed and the original timeout message remains the visible failure.

The author proved the fix against the real exported `runCliCommand`, not just a mocked process wrapper. In the reported proof, a real child process was alive before abort, dead after abort, and the command rejected promptly with the expected timeout message.

That kind of proof matters here because the bug lived below the tool interface. A unit test that only checks the caller's promise can miss a child process that keeps running in the operating system.

## Why Operators Should Care

Memory search sits on a hot path for long-lived agents. It is common to search past notes, transcripts, and knowledge collections while deciding what to do next. If those searches time out under load, the runtime should shed work cleanly.

This patch does not make QMD search faster by itself. It makes failure cheaper and more predictable. That is the right layer for this fix.

The PR reports passing coverage for the process runner, QMD manager abort behavior, grouped search aborts, and the memory tool timeout path. It also covers both already-aborted calls and in-flight subprocess cancellation.

For teams running OpenClaw with QMD-backed memory, the practical improvement is straightforward: a timed-out `memory_search` should no longer leave a background QMD process burning resources after the agent has moved on.
