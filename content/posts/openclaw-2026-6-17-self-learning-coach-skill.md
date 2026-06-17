---
title: "OpenClaw Skill Teaches Business Workflows"
excerpt: "A new OpenClaw ClawHub skill turns documents, internal workflows, and web sources into adaptive lessons with HTML pages and teach-back loops."
coverImage: '/assets/images/posts/openclaw-2026-6-17-self-learning-coach-skill.png'
date: '2026-06-17T08:02:00.000Z'
dateFormatted: June 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-17-self-learning-coach-skill.png'
---

ClawHub published a notable new learning-oriented skill overnight: [Self Learning Coach v0.1.3](https://clawhub.ai/zzj997/self-learning-coach-v0-1). It is designed to turn a business topic, internal process, document, wiki page, file, pasted text, or web source into an adaptive learning path.

The skill is especially interesting because it treats OpenClaw as a workplace learning surface, not only a task executor. Its description targets scenarios like learning a business process, studying from Feishu documents, generating a lesson page, doing teach-back practice, reviewing unfinished learning, and deciding what to study next.

That makes it a good example of where ClawHub skills are heading: packaged workflows that combine source handling, teaching structure, generated artifacts, and delivery rules for specific runtimes.

## What The Skill Does

Self Learning Coach asks the agent to act as a business self-learning coach for employees. The goal is not to quiz the user first. It is to help them understand, recall, and apply a topic through a short learning loop.

The workflow is structured around:

- A lightweight learning contract
- An adaptive one-to-five-stage learning path
- A self-contained HTML lesson for the first stage
- Source notes that separate provided material, web material, internal sources, and general knowledge
- Teach-back dialogue after the lesson
- A compact end-of-session learning record
- Local progress and source tracking when lesson files are created

The skill also includes rules for unfinished learning lists. If the user asks what is left, where they stopped, or what to study next, the agent should build a progress view from accessible evidence rather than guessing.

## Source Handling Is The Standout

The most useful part of the skill is its source strategy. It does not tell the agent to search the web for every lesson. Instead, it routes based on user intent.

If the user says to use only a provided document, the skill says not to search the web. If the user asks for latest facts, public material, or original links, web verification becomes appropriate. If the topic is internal business knowledge, the skill prefers internal or provided sources and warns against silently filling gaps from public knowledge.

That source discipline matters for workplace learning. A lesson about a company's support process or sales workflow should not be padded with generic internet assumptions unless the user explicitly asks for public context.

The HTML lesson requirements also reflect that concern. Each lesson should include a top source card, source notes, clickable references when available, and plain language about whether the material came from public sources, internal sources, provided files, or general knowledge.

## Built For Feishu And OpenClaw

The skill has detailed Feishu and Miaoda delivery rules, which makes sense given the target audience. It warns that simply returning a local `MEDIA:` path may fail in Feishu, prefers the local Feishu CLI route for sending HTML files, and asks the agent to verify delivery before claiming success.

For Codex and other generic OpenClaw runtimes, the skill falls back to creating a local HTML file and returning the path. That split is small but important: skills that understand their delivery surface feel much more reliable than generic prompt packs.

The latest version changelog says v0.1.3 adds adaptive lesson counts, source index tracking, stable Feishu-light HTML style, collapsible recall answers, Feishu link fallback, and Codex or Trae delivery guidance.

## Why It Matters

Self Learning Coach is not a flashy integration. It is a workflow product packaged as a skill. That is exactly the kind of thing ClawHub needs more of.

OpenClaw users already ask agents to summarize docs and explain processes. This skill makes that pattern more durable: source-aware, lesson-shaped, artifact-producing, and explicit about what evidence was used.

The skill has no downloads yet at the time of this scan, so it is early. But the design is substantial enough to watch. If ClawHub becomes the place where teams publish repeatable business workflows, learning and onboarding skills like this may become some of the most practical packages in the ecosystem.

Sources: [Self Learning Coach on ClawHub](https://clawhub.ai/zzj997/self-learning-coach-v0-1) and the [ClawHub API listing](https://wry-manatee-359.convex.site/api/v1/skills?limit=10).
