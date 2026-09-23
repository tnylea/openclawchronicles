---
title: "OpenClaw Speeds Up Long Chat Composer Typing"
excerpt: "OpenClaw's Control UI avoids expensive layout reads so typing in long chat transcripts stays responsive."
coverImage: '/assets/images/posts/openclaw-2026-9-23-composer-typing-responsive.png'
date: '2026-09-23T23:02:00.000Z'
dateFormatted: September 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-23-composer-typing-responsive.png'
---

OpenClaw merged a Control UI performance fix that targets one of the most visible kinds of latency: typing into a long-running chat. [PR #154443](https://github.com/openclaw/openclaw/pull/154443) fixes a composer path where each character could stall for hundreds of milliseconds when long transcripts made synchronous layout reads expensive.

The issue was tracked as [#145777](https://github.com/openclaw/openclaw/issues/145777). The merged fix focuses on the input sizing and overflow path, not on replacing the entire transcript controller.

## What Changed in the Composer

The new implementation uses native `field-sizing: content` for the real input when the browser supports it. That allows the browser to own the growth behavior without OpenClaw repeatedly measuring textarea and transcript geometry on the input path.

Fallback behavior still exists for unsupported browsers, explicit draft replacement, and width changes. The important part is that ordinary native input no longer needs to read textarea or transcript layout just to keep typing and sizing in sync.

The PR also keeps end-follow and reader-position ownership with the existing transcript controller. That matters because chat scroll behavior is already subtle: users may be at the bottom following new output, or they may be reading history. This change avoids adding a second scroll state machine for the composer.

## User Impact

For users, the practical win is smoother typing in long chats. OpenClaw conversations can include lengthy transcripts, tool results, code blocks, and async question flows. If the composer blocks on synchronous layout work for every keystroke, the UI starts to feel heavy right when the user is trying to steer the agent.

The merged fix keeps the expected behaviors in place:

- Composer growth still keeps the transcript at the bottom when following.
- Reading older history remains under the current transcript ownership model.
- Short and capped draft overflow paths remain covered.
- Restored drafts and unsupported-browser fallback behavior remain intact.

That is the better kind of performance work: remove input-time cost without making the UI less predictable.

## Verification

The PR went through an extended repair and validation cycle before merging. Its exact-head CI run passed with all 89 jobs terminal: 74 passed and 15 intentionally skipped. The evidence also calls out real browser coverage for native scrollbar shrink behavior, undo/redo, and value-write guards.

The original problem was not just theoretical. The PR links the regression history to earlier composer autosizing and transcript capture changes, then shows the new path preserving current-main composer integration.

For anyone who lives in long OpenClaw sessions, this is a quality-of-life fix with outsized feel. The chat box should now act less like it is dragging the whole transcript behind every keypress.
