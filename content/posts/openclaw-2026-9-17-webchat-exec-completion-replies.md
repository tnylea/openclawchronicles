---
title: "OpenClaw Restores WebChat Exec Completion Replies"
excerpt: "OpenClaw PR #148360 restores background exec completion replies in WebChat sessions, so Control UI users can see finished command results."
coverImage: '/assets/images/posts/openclaw-2026-9-17-webchat-exec-completion-replies.png'
date: '2026-09-17T22:34:00.000Z'
dateFormatted: September 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-17-webchat-exec-completion-replies.png'
---

OpenClaw merged [PR #148360](https://github.com/openclaw/openclaw/pull/148360), a P1 infrastructure fix for a frustrating internal-session gap: background `exec` jobs could finish successfully after being launched from WebChat, but the completion reply never appeared back in the Control UI or Windows Companion session that started them.

The work was done. The follow-up turn ran. The person watching the internal WebChat session just did not get the result.

## What Changed

The PR adds a guarded publication path for heartbeat-driven completion replies that originate from internal WebChat sessions. Instead of treating the completion as undeliverable because it has no external channel target, OpenClaw can now publish the reply into the originating session's transcript when that session is eligible.

The eligibility check stays narrow. The PR says hidden internal sessions are not turned into recipients, and explicit suppression still stays silent. A `heartbeat.target` of `none` continues to publish nothing, as does an explicit target that resolves to no deliverable route.

For ordinary user-opened internal sessions, though, the result is now visible in the place users expect: the same WebChat conversation where the background command began.

## Why It Matters

Background command completion is one of those reliability features that only feels small until it fails. If a long-running command completes and the UI never receives the result, users are left guessing whether the job failed, hung, or quietly succeeded somewhere else.

The merged fix aligns WebChat with external channels like Telegram, where completion delivery was already working. It also treats the published result as ordinary model context rather than delivery bookkeeping, so replay, push, waits, and the composer see it as the actual reply.

The PR keeps the existing boundaries intact:

- No new command execution surface
- No schema change or migration
- No new configuration option
- No extra network destination
- Existing session generation, cancellation, writer, and active-transcript checks still apply

## Evidence From The PR

The validation attached to the PR is unusually detailed. The authors ran a real Gateway, real Control UI client, real background `exec`, and real heartbeat path. The model call was scripted in the main proof so the delivery path could be tested deterministically.

The before-and-after result was clear: the baseline completed the background command but rendered zero completion rows, while the fixed head rendered the completion exactly once. A suppression arm with `heartbeat.target: none` still rendered no completion row.

The final merged PR also reports sanitized AWS execution across 569 tests in 22 files, changed-file checks, builds, connected exactly-once delivery, disconnected/reopen/reload history, and inspected screenshots. The PR labels it P1 with sufficient proof.

For users who run automation through the browser UI, this is a practical reliability repair: completed background work should no longer disappear from the internal chat surface that kicked it off.
