---
title: "OpenClaw Fix Keeps Subagent Commentary Private"
excerpt: "OpenClaw PR #128584 stops private subagent commentary from appearing in logs and completion announcements while preserving final answers."
coverImage: '/assets/images/posts/openclaw-2026-8-24-subagent-commentary-privacy.png'
date: '2026-08-24T08:02:00.000Z'
dateFormatted: August 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-24-subagent-commentary-privacy.png'
---

OpenClaw merged [PR #128584, "fix(subagents): hide private commentary from logs and completion announcements"](https://github.com/openclaw/openclaw/pull/128584), a P1 fix for a privacy-sensitive subagent logging path.

The issue was narrow but important. According to the PR, operators reading `/subagents log` or receiving automatic subagent completion announcements could see private intermediate assistant commentary. At the same time, genuine saved assistant answers could disappear from subagent logs when represented as persisted Responses `output_text` or `input_text` blocks.

That is the kind of failure mode agent systems have to treat seriously. Subagents often do messy intermediate work, and logs are useful only when they expose the right boundary: enough final output to understand what happened, without leaking private scratch commentary.

## What Changed

The repair routes assistant-message consumers through OpenClaw's existing canonical sanitized history extractor. That matters because there was already one owner for filtered history; the bug came from a separate content-only extractor and completion announcements that bypassed phase filtering for scalar message content.

The PR says the new path preserves user-message handling and existing output normalization. It also removes a now-obsolete test-only sanitizer export.

In practical terms, logs and completion announcements should now show actual assistant answers, including persisted Responses answers that were previously invisible, while commentary-only messages stay out of user-facing output.

## Why It Matters

The impact is not just cosmetic. Subagent logs are often used for debugging delegated work, reviewing background progress, or catching failures after a long task finishes. If those logs can expose private commentary, they become risky to share or inspect in connected channels.

The opposite bug is also costly: if real final answers disappear, the log becomes misleading. Operators may think a subagent returned nothing when the answer was actually saved in a different Responses block shape.

This PR fixes both sides of that boundary:

- Private intermediate commentary is filtered out of logs and announcements.
- Real assistant answers remain visible when they are legitimate final output.
- Empty final messages are omitted instead of falling back to legacy private text.
- Existing silent-reply behavior and user text handling remain unchanged.

## Evidence

The PR reports five actual `/subagents log` regressions that failed before the fix, covering mixed commentary and final output, commentary-only messages, empty signed finals with legacy private text, persisted `output_text`, and persisted assistant `input_text`.

It also notes an independently found sibling issue where scalar commentary was announced as a completed subagent result. The focused validation covered subagent announcements, command output, shared chat content handling, and session behavior, with 201 tests passing across five test projects.

The production diff is small: the PR reports a net reduction of 17 production lines while adding targeted regression tests.

## Bottom Line

PR #128584 tightens one of OpenClaw's more sensitive display boundaries.

Subagent systems need useful logs, but those logs should not accidentally become a transcript of private assistant work. This fix brings subagent logs and completion announcements back to the intended contract: final answers are visible, private commentary is not.

