---
title: "OpenClaw Skill Workshop: Review Agent Skills Before They Ship"
excerpt: "Skill Workshop puts a proposal-and-review step between your agent and its reusable behaviors, so nothing becomes permanent until you approve it."
coverImage: '/assets/images/posts/openclaw-2026-6-4-skill-workshop.png'
date: '2026-06-04T08:05:00.000Z'
dateFormatted: June 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-4-skill-workshop.png'
---

OpenClaw's official blog [published a deep look at Skill Workshop](https://openclaw.ai/blog/openclaw-agent-skill-workshop) this week — a feature that changes how agents create and revise reusable skills. The short version: nothing becomes a live skill until you explicitly approve it.

## The Problem Skill Workshop Solves

[Skills](https://docs.openclaw.ai/tools/skills) in OpenClaw are how you teach an agent reusable procedures. A skill might define an invoice follow-up routine, a deployment checklist, or a weekly repo health workflow with supporting scripts and templates. Once a skill is active, it shapes how the agent behaves on future runs.

That's the catch. A bad skill answer is a bad answer — you can ignore it. A bad skill is a mistake baked into future behavior.

Before Skill Workshop, there was no formal gate between "agent drafts a skill" and "skill is active." Now there is.

## How the Proposal Flow Works

When an agent creates or revises a skill through Skill Workshop, it produces a **proposal** rather than writing the skill directly. The proposal sits as `PROPOSAL.md` in the skill directory — not `SKILL.md`. It is not active. The agent does not run it.

A proposal carries:
- The draft instruction content
- Any support files (templates, scripts, examples, references)
- Its review state (pending, applied, rejected, stale)
- The metadata OpenClaw needs to apply or roll it back cleanly

The revision loop looks like normal collaboration:

> You: Make this weekly inbox routine reusable.
> Agent: Drafted a proposed skill.
> You: Add the VIP sender rule and make the dry-run step clearer.
> Agent: Revised the proposal.
> You: Use it.

The agent doesn't write directly into live skills. It doesn't need to guess the correct file path, navigate the skill folder structure, or handle the approval mechanics itself. It uses Skill Workshop.

## Two Views for Review

The **Board view** is the full workshop interface. All proposals are visible — pending, applied, rejected, and stale — with search, state filters, and the ability to inspect any support files before applying.

The **Today view** is the faster mode. It surfaces the next pending proposal with a single concrete question: should this become part of your skill set? Approve it, revise it in conversation, or skip it.

The "Tweak" action is where the workshop earns its name. Generated skills are often almost right — the wording is slightly off, a step is missing, a support file should be a template instead of a script. Skill Workshop keeps those fixes as revisions to the same proposal, with history intact, rather than forcing you to start over.

## Support Files Are Part of the Proposal

Useful skills frequently need supporting material. A digest skill might carry a response template. A deployment skill might need a smoke-test script. A debugging skill might include example log output.

Skill Workshop keeps those files with the proposal and shows them in the UI before you apply anything. They're scanned along with the proposal body. They're written with the skill on approval.

The write path is deliberately narrow: support files are only allowed under `assets/`, `examples/`, `references/`, `scripts/`, and `templates/` within the skill directory. No absolute paths, no directory traversal, no writing outside the skill boundary.

## Works Everywhere

The same proposal flow works from:

- **Chat** — ask your agent to draft a reusable workflow
- **Control UI** — Board and Today views in the Skill Workshop tab
- **Channels** — Telegram, Discord, Slack, etc. (when agent is granted access)
- **CLI** — `openclaw skills workshop` commands
- **Gateway** — via the agent tool API

Proposals created in one surface are reviewable in any other. An agent running in a Telegram channel can draft a proposal you review in the Control UI and apply from the CLI.

## Why It Matters

Skill Workshop is OpenClaw's answer to a question every serious agent operator eventually asks: how do I let agents improve themselves without losing control of what they become?

The proposal system gives you that control without making skill creation a manual-only process. Agents still do the drafting. You still make the call on what ships.

Full documentation is at [docs.openclaw.ai/tools/skill-workshop](https://docs.openclaw.ai/tools/skill-workshop).
