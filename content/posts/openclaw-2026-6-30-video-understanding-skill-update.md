---
title: "OpenClaw Video Understanding Skill Adds Follow-Ups"
excerpt: "ClawHub's Video Understanding skill now supports durable follow-up Q&A with Gemini File API reuse, cache metadata, and cache cleanup."
coverImage: '/assets/images/posts/openclaw-2026-6-30-video-understanding-skill-update.png'
date: '2026-06-30T23:10:00.000Z'
dateFormatted: June 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-30-video-understanding-skill-update.png'
---

ClawHub's `video-understanding` skill picked up a meaningful update in the June 30th nightly feed. The skill is not new, but its latest version, `1.3.0`, adds durable follow-up support for video Q&A workflows.

That makes it worth a skills spotlight. The [ClawHub API feed](https://wry-manatee-359.convex.site/api/v1/skills?limit=20) shows `video-understanding` with 63 installs, 5 stars, and a latest-version changelog focused on Gemini File API reuse, optional cached content, conversation cache metadata, cache purge, and Slack-thread video Q&A documentation.

## What the Skill Does

The skill is designed to trigger whenever a user provides a video URL, YouTube link, or video file and asks the agent to watch, inspect, summarize, transcribe, analyze, or extract answers from it.

That is a natural OpenClaw workflow. Video is increasingly a source format for product research, meeting analysis, creator workflows, tutorials, and bug reports. Without a dedicated skill, agents often treat video links as ordinary web pages, which loses the visual and temporal information.

`video-understanding` narrows that gap by giving OpenClaw a repeatable path for video-aware analysis.

## Why Follow-Up Support Matters

The important change in version `1.3.0` is durability. One-shot video summaries are useful, but real users rarely stop there. They ask follow-up questions:

- "What did they say about pricing?"
- "Pull out the setup commands."
- "Which part showed the error?"
- "Compare this clip with the previous one."

If every follow-up has to re-upload or reprocess the same video from scratch, the workflow gets slower and more expensive. The new changelog points to Gemini File API reuse and optional cached content, which should help the skill keep context available across follow-up turns.

The conversation cache metadata is also important. Agents need to know which file or cache belongs to which thread, especially in Slack or other shared chat systems where several videos may be discussed at once.

## Slack Thread Video Q&A Is the Right Shape

The mention of Slack-thread video Q&A documentation is a good sign. OpenClaw's strongest real-world workflows often happen inside long-running team threads rather than isolated CLI prompts.

For example, a team could drop a support recording, demo clip, screen recording, or customer interview into a Slack thread and ask OpenClaw to extract action items. The follow-up questions then stay attached to that thread instead of becoming a disconnected series of fresh analyses.

That is exactly where durable cache metadata helps. The agent can answer the second and third question as part of the same analysis context, not as a new cold start.

## Cache Cleanup Is Part of the Feature

The changelog also mentions cache purge. That may sound like maintenance, but it is part of making video workflows operationally safe.

Video assets can be large, expensive to keep, and sometimes sensitive. A skill that can reuse cached video context also needs a cleanup path so old analysis state does not linger forever. In production OpenClaw deployments, retention and cleanup are not afterthoughts.

## Bottom Line

The `video-understanding` update is a good example of where ClawHub skills are heading: not just a prompt wrapper, but a small workflow system with state, cleanup, and channel-aware documentation.

If your OpenClaw setup handles product demos, tutorials, sales calls, bug videos, or social clips, version `1.3.0` is worth a look. The practical win is simple: analyze a video once, then keep asking useful questions without rebuilding the whole context every time.
