---
title: "OpenClaw Codex Fixes Structured Tool Contracts"
excerpt: "OpenClaw improved Codex abort detection, dynamic tool-schema repair, and native tool-result middleware visibility in one runtime update."
coverImage: '/assets/images/posts/openclaw-codex-structured-tool-contracts.png'
date: '2026-07-15T08:02:00.000Z'
dateFormatted: July 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-codex-structured-tool-contracts.png'
---

OpenClaw merged a Codex integration update this morning that replaces brittle text parsing with structured runtime contracts in three places. [PR #108105](https://github.com/openclaw/openclaw/pull/108105), titled `fix(codex): structured abort detection, tool-schema repair, native-result middleware relay`, closes several bugs that shared the same root cause: OpenClaw was relying too much on raw prose or unnormalized payloads at Codex boundaries.

The result is a cleaner contract between OpenClaw, Codex-native tool calls, dynamic OpenClaw tools, and plugin middleware.

## Three Fixes in One PR

The first fix changes abort detection. The old path looked for specific private Codex text inside interrupt markers. If that wording changed upstream, OpenClaw could misclassify the turn. The new behavior keys off the correlated `turn/completed` status, treating the interrupt marker as a hint rather than the terminal source of truth.

The second fix repairs sloppy-but-repairable dynamic tool schemas before projection. The PR calls out `type: null` schemas as one concrete failure case: those could produce HTTP 400 errors or cause tools to be dropped. OpenClaw now strips annotation-only nulls, infers object or array types when the shape is unambiguous, and still quarantines genuinely unsafe constraints instead of silently widening what a tool accepts.

The third fix routes Codex-native tool results through `agentToolResultMiddleware` at the post-tool-use relay boundary. The middleware remains observe-only for native Codex results because the Codex hook contract does not allow replacing the tool response, but plugin authors now get visibility they previously lacked.

## Why It Matters

This is not a flashy user-interface feature, but it is the sort of runtime work that makes agents feel less mysterious when things go wrong. Structured abort handling reduces false cancellation stories. Tool-schema repair keeps useful dynamic tools alive without weakening invalid-schema safeguards. Middleware visibility gives plugin authors a more complete operational picture.

The PR includes focused test evidence across attempt notifications, turn watches, dynamic tools, provider tools, and native hook relay suites. It also documents that the invalid-schema path remains fail-closed, which is the important security detail.

## Developer Takeaway

If you maintain Codex-facing OpenClaw plugins, the main improvement is consistency. Tool schemas that can be safely normalized are more likely to work, while malformed constraints should still quarantine. Middleware observers should also see more native tool activity than before.

For operators, the change should show up as fewer confusing abort classifications and fewer cases where one questionable dynamic schema breaks the whole request. It is a quiet but valuable step toward a more contract-driven OpenClaw runtime.
