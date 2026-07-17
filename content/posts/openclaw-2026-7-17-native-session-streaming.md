---
title: "OpenClaw Streams Native Session Catalogs"
excerpt: "OpenClaw now streams Claude Code and Codex native session catalogs host by host instead of waiting for the slowest machine."
coverImage: '/assets/images/posts/openclaw-2026-7-17-native-session-streaming.png'
date: '2026-07-17T23:03:00.000Z'
dateFormatted: July 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-17-native-session-streaming.png'
---

OpenClaw's native coding-agent catalog is getting faster and fresher. [PR #110211](https://github.com/openclaw/openclaw/pull/110211), `improve: stream native sessions as hosts finish`, merged at 22:59 UTC on July 17.

The change targets a familiar distributed-systems annoyance: a UI that waits for the slowest machine before showing anything useful. In this case, opening Chat with native Claude Code or Codex session discovery enabled could wait for the slowest paired computer before rendering useful sessions.

Sessions created outside OpenClaw could also remain stale until a reload or unrelated refresh.

## Host-By-Host Discovery

OpenClaw now lets native catalog providers publish each host page as it finishes. The aggregate RPC response remains the authoritative recovery path, but the Control UI no longer has to wait for every host before it can show the first useful result.

The UI merges scoped events, reconciles every 30 seconds while visible, follows observed changes after 5 seconds, and refreshes on focus or paired-node presence changes.

The protocol addition is optional. If a new UI talks to an older Gateway that rejects the progressive `progressId` schema, it retries without that field. That preserves compatibility while still allowing newer Gateway and UI pairs to stream progressive results.

## The User Impact

The user-facing effect should be straightforward: Claude Code and Codex sessions begin appearing host by host instead of after the slowest computer finishes.

The PR says sessions created directly in either CLI are picked up within 30 seconds while the page remains visible, or immediately after focus or connectivity invalidation.

It also hardens the messy parts around progressive state:

- late slow-host results remain usable after fail-soft aggregate timeout;
- stale streams cannot overwrite newer healthy state;
- reconnect races and expanded-page refreshes are handled;
- duplicate activation events and temporary host errors cannot clobber fresher catalog data.

## Benchmark Signal

The proof section includes a useful live benchmark from a four-node macOS setup. The first useful host page appeared in about 1.8 seconds, while the aggregate response took about 9.7 seconds.

That is the difference between a catalog that feels alive and one that feels stuck. For users with several paired computers or remote coding hosts, showing partial results early is a direct quality-of-life improvement.

The PR also reports live proof that a newly created Codex session appeared in the normal 40-row catalog and that a newly created Claude Code session appeared from a connected node without a reload.

## Evidence

OpenClaw reports a production build in 1 minute 58 seconds, with Control UI startup JavaScript staying under the stated gzip limit. Browser E2E coverage passed 6 of 6 cases, including a completed host rendered while the aggregate request remained pending.

Focused tests also passed across Claude, Codex, Gateway/protocol, and sidebar paths, followed by a full changed-surface Testbox gate across core, UI, plugins, docs, formatting, lint, and typechecks.

## Operator Takeaway

PR #110211 is not just a UI speed tweak. It is part of OpenClaw's broader move toward native coding agents spread across local hosts, paired nodes, and remote workers.

As that topology grows, catalog discovery has to become progressive, resilient, and refresh-aware. This change makes the Chat surface feel less dependent on the slowest machine in the room.
