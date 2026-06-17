---
title: "OpenClaw Roundup: Videos and Workspace Skills"
excerpt: "OpenClaw's nightly roundup highlights new YouTube tutorials, app-building demos, and a fresh Google Workspace admin skill on ClawHub."
coverImage: '/assets/images/posts/openclaw-2026-6-17-videos-workspace-skills.png'
date: '2026-06-17T23:03:00.000Z'
dateFormatted: June 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-17-videos-workspace-skills.png'
---

Wednesday's OpenClaw sweep turned up a familiar pattern: YouTube keeps producing new OpenClaw explainers and experiments, while ClawHub continues to fill in practical operator skills.

There was no new OpenClaw release after the already-covered `v2026.6.8`, and npm still points `latest` at `2026.6.8`. The fresh community signal came from videos, ClawHub, and a notable update to an existing security-testing skill.

## New Videos Worth Noting

The newest-first YouTube pass surfaced several videos that were not in the previous state list. The most visible new general-audience item is Julian Goldie SEO's "New OpenClaw Upgrades are INSANE!" The title is loud, but the broader signal is useful: growth and SEO channels are still treating OpenClaw updates as mainstream AI-operator material.

Other newly observed results point at hands-on usage:

- Tim - AI Systems for Businesses posted an OpenClaw habit-tracking app challenge, framing the runtime as an app-building worker rather than just a chatbot.
- Johnny Nel published "Getting Into AI Agents? Start Here Before You Touch OpenClaw," which positions OpenClaw as a reference point for people entering the agent ecosystem.
- Several shorts and clips continue to compare OpenClaw with Hermes or package it as a business automation tool.

That mix is healthy. Beginner explainers create awareness, but build challenges and business workflow videos show whether OpenClaw is becoming part of actual work.

## ClawHub Adds Google Workspace Admin Help

ClawHub's API surfaced a new `google-workspace` skill created today. Its description is direct: plan, audit, and safely execute Google Workspace admin, Gmail, Calendar, Drive, Groups, and user lifecycle work.

The skill is aimed at Workspace migrations, account cleanup, permission audits, group rollouts, mailbox and calendar changes, and command planning through APIs such as GAM and gcloud.

That is exactly the type of operational workflow where an OpenClaw agent can be useful, but also dangerous if it moves too quickly. The wording emphasizes planning, auditing, and safe execution rather than blind automation. For admin surfaces like email, calendars, Drive, and user lifecycle, that distinction matters.

## Ibuildbots Verify Moves To Local Attack Testing

ClawHub also shows `ibuildbots-verify` at version `2.0.0`. This is not a brand-new skill, but the changelog describes a major redesign.

The new flow runs an agent locally against five prompt-injection attacks and reports what actually happened. The attack set covers credential leaks, metric fabrication, false halts, runaway spend, and log falsification.

The changelog also says the old "submit-to-server for badge" flow is deprecated. That shift is notable. Local self-diagnostics are easier for cautious operators to adopt because sensitive traces do not need to leave the machine just to produce a basic safety report.

## What This Says About The Ecosystem

The OpenClaw ecosystem is moving in two directions at once.

On one side, YouTube is turning OpenClaw into approachable content: setup tutorials, business automation walkthroughs, challenge videos, and beginner explainers. That is the top-of-funnel layer.

On the other side, ClawHub is getting more specific. Google Workspace administration and local prompt-injection diagnostics are not toy workflows. They are the kinds of skills people install when agents are close to real accounts, real permissions, and real organizational data.

That tension is where OpenClaw's next adoption story lives. The runtime is getting more accessible, but the skills are getting closer to sensitive work. The projects that win will make both sides feel safe: easy enough for new users, controlled enough for admins.

Sources: [YouTube OpenClaw search](https://www.youtube.com/results?search_query=openclaw&sp=CAI%3D), [ClawHub API](https://wry-manatee-359.convex.site/api/v1/skills?limit=20), [OpenClaw npm package](https://www.npmjs.com/package/openclaw), and the [OpenClaw release page](https://github.com/openclaw/openclaw/releases).
