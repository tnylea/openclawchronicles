---
title: "OpenClaw Cron Gains Durable Stream Sources"
excerpt: "OpenClaw cron jobs can now react to supervised command streams while preserving source identity across restarts and edits."
coverImage: '/assets/images/posts/openclaw-2026-7-21-cron-stream-sources.png'
date: '2026-07-21T23:03:00.000Z'
dateFormatted: July 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-21-cron-stream-sources.png'
---

OpenClaw's automation system picked up a major cron capability tonight: stream schedule sources. [PR #112387](https://github.com/openclaw/openclaw/pull/112387), titled "feat(cron): stream schedule sources with durable source identity," lets a Gateway-supervised long-running command trigger cron work from stdout or stderr lines.

This is useful for event-style automation. Instead of polling on a fixed interval, an operator can run a watched command and let matching output lines fire a batched cron job. The important part is not only that OpenClaw can watch streams. It is that the stream identity now survives the lifecycle edge cases that make long-running automation tricky.

## What Changed

The new stream schedule mode is gated behind `cron.triggers.enabled` and adds CLI and tool options such as `--stream-command`, `--stream-mode`, `--stream-match`, and batching bounds. Documentation was updated in `docs/automation/cron-jobs.md`.

The core design uses two separate identities:

- `streamSourceIdentity`, a persisted cron-store-owned UUID for the logical source.
- An in-memory watcher process generation that only fences callbacks from stale child processes.

That split is the central fix. Earlier designs conflated process restart generation with cron admission. A child restart could retire a legitimate final batch, while a disable/re-enable or schedule edit could allow a stale queued batch to run during teardown. The merged design keeps source identity stable across supervised restarts but rotates it when ownership actually changes.

## Why It Matters

Stream-triggered automation needs to be precise. If a source is edited, disabled, removed, or replaced, stale output should not trigger new work. If a supervised child process restarts under the same logical source, legitimate output should not be dropped just because the process generation changed.

OpenClaw now checks schedule key and source identity together during cron admission. Owner state and failure persistence are identity-guarded too, so a retired owner cannot write terminal state onto a re-created same-key job.

The PR also fixes adjacent stream-watcher edge cases:

- Match regexes run against raw source text before rendering truncation markers.
- Oversized-line matching is independent of pipe chunking.
- `stopAll` waits for every owner teardown before reporting failure.
- EOF does not promote a retained prefix into a match after its continuation was dropped.
- Failed shutdown drains can be retried instead of being memoized forever.

For operators, the result is a cleaner event bridge between local command output and OpenClaw scheduled work.

## Proof From The PR

The implementation spans protocol schemas, cron service admission, Gateway stream watcher modules, CLI options, UI types, docs, and prompt snapshots. The large watcher was split into lifecycle, output, and registry modules to stay under the repository's line-budget rules.

The PR reports 62 watcher and output tests, 55 focused `server-cron` tests, 33 stream trigger and validation tests, a larger earlier cron and Gateway sweep of 1,581 tests, clean `tsgo --noEmit`, clean `oxlint`, formatted output, and a green remote build.

This is a solid automation feature, but the bigger story is reliability: OpenClaw can now treat a stream source as a durable logical thing rather than a fragile child process.
