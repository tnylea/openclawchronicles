---
title: "OpenClaw Preserves Code in Streamed Replies"
excerpt: "OpenClaw PR #146361 keeps code examples, attachments, reply targets, and delivery facts intact across streamed replies and recovery."
coverImage: '/assets/images/posts/openclaw-2026-9-20-streamed-reply-preservation.png'
date: '2026-09-20T08:01:00.000Z'
dateFormatted: September 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-20-streamed-reply-preservation.png'
---

OpenClaw merged [PR #146361](https://github.com/openclaw/openclaw/pull/146361), a large Gateway and Telegram delivery fix focused on preserving reply content as streamed answers cross delivery, transcript, and recovery boundaries.

The PR says it fixes cases where code examples, attachment details, and reply targets could be lost. That is a deceptively important repair: losing indentation, metadata, or target intent can turn a useful assistant response into a confusing one, especially in chat apps where code blocks and media attachments are part of the answer.

## What users should notice

The user-facing goal is straightforward. Replies should retain:

- Code indentation and literal control-token examples.
- Attachment associations and source aliases.
- Reply intent and explicit speech facts.
- Eligible Telegram preview quotes during finalization.
- Recovery behavior that avoids resending already delivered attachments.

The PR also fixes a false warning path: successful text-and-audio replies should no longer look like missing responses. For text-only queue insertion failures, OpenClaw now reports a definitive non-send only after observing a transaction rollback.

## Why this was hard

The fix is not just a formatting patch. OpenClaw has to move replies through planning, dispatch, channel delivery, transcript projection, and sometimes recovery. Each step can clone, normalize, stage, or persist a different representation of the same answer.

The merged change keeps the raw directive parser as the owner of interpretation while carrying prepared text and delivery facts through the rest of the path. The shared media preparer stages bytes once, and final selection preserves surviving file metadata and source aliases without reopening the original source.

That distinction matters because persisted facts should describe what happened, not grant new runtime authority. The PR keeps that boundary intact while making recovery more faithful.

## Telegram gets special attention

Telegram appears throughout the evidence because it is one of the harder delivery surfaces. The PR keeps recovered finals from resending block media, exercises prepared replies through native transport, and moves recovery suites onto existing SDK test facades.

The hosted Telegram Package Acceptance run linked from the PR passed all three ordered stream, target-recovery, and media-recovery cases. Those tests used Telegram's Test Server, an independent user, and scripted model responses. The PR is explicit that this is not a live-model or Telegram-client visual test, which is the right kind of caveat.

## Validation notes

The published head for the PR was `1956cf95c19678d65ce487812de2a14bb4c229f1`. The PR reports current-head CI passing with 161 terminal jobs and zero failures. It also links a Telegram Package Acceptance run where all three cases passed.

Additional targeted validation included:

- 23 doctor-file cases.
- A full terminal-reply QA scenario covering visible, silent, fallback, private, and restart verdicts.
- 62 cases across queue, worker-error, and task-query suites.
- Fresh inspected UI before/after captures for current shell and footer startup.

OpenClaw's delivery system has a lot of small ownership boundaries. This PR is valuable because it preserves those boundaries while making the answer the user sees match the answer the agent actually authored.

