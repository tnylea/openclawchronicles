---
title: "OpenClaw Migration Guide Hits Hacker News"
excerpt: "A Hermes guide for migrating from OpenClaw reached Hacker News today, sparking debate over agent stacks, context overhead, and migration paths."
coverImage: '/assets/images/posts/openclaw-2026-6-18-hermes-migration-hn.png'
date: '2026-06-18T23:02:00.000Z'
dateFormatted: June 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-18-hermes-migration-hn.png'
---

OpenClaw's ecosystem story got an interesting community signal today: a Hacker News submission titled ["Migrate from OpenClaw"](https://news.ycombinator.com/item?id=48586005) climbed to 110 points and 90 comments, linking to the [Hermes Agent migration guide](https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw).

The guide is not an OpenClaw release or an official OpenClaw document. It is a competing agent stack explaining how to import an OpenClaw, Clawdbot, or Moldbot setup into Hermes. But the discussion is worth watching because migration guides only get traction when a community is actively comparing runtime models, not merely trying demos.

## What Hermes Says It Imports

The Hermes guide centers on a `hermes claw migrate` command. It says the migration reads from `~/.openclaw/` by default, detects older `~/.clawdbot/` and `~/.moltbot/` directories, and previews the migration before making changes.

The mapped data is exactly the kind of state long-running OpenClaw users care about:

- Persona files such as `SOUL.md`
- Workspace instructions such as `AGENTS.md`
- Long-term memory from `MEMORY.md`
- User profile notes from `USER.md`
- Daily memory files
- Workspace and managed skills

The guide also calls out explicit handling for secrets. Even a full preset does not import API keys unless `--migrate-secrets` is passed. That is the right default for a migration tool crossing agent runtimes.

## The HN Debate

The Hacker News thread quickly moved beyond the mechanics of copying files. Commenters debated Hermes itself, OpenClaw-style runtime complexity, context overhead from skills, and whether self-hosted agent systems should stay closer to a minimal coding-agent core plus external gateways.

One commenter described disabling many default skills and still seeing large context use. Another framed the title as important: this is specifically a migration path from OpenClaw, not a generic Hermes launch.

That distinction matters. OpenClaw has become large enough that other projects now define themselves partly by their compatibility with it, their migration paths away from it, or their lighter-weight alternatives to it.

## Why This Is News for OpenClaw Users

This is not a panic story. A migration guide does not mean OpenClaw is losing its center of gravity. In fact, the existence of an OpenClaw importer reinforces the opposite: OpenClaw's file conventions, persona model, memory layout, and skill folders have become an ecosystem target.

But it does show where the competitive pressure is sharpening:

- Lower-friction onboarding
- Smaller default context footprint
- Clear migration and rollback paths
- Compatibility with existing agent identities and memories
- Simple ways to move skills without losing provenance

OpenClaw has already been investing in these areas through Skill Workshop, ClawHub, database-first state work, and safer provider routing. The Hermes thread is another reminder that agent runtimes are no longer competing only on what they can do; they are competing on how cleanly users can bring their existing working context with them.

## The Takeaway

For operators, the practical advice is boring but valuable: keep your OpenClaw workspace organized. If your `SOUL.md`, `AGENTS.md`, skills, and memory files are clean, they become portable assets regardless of whether you stay on OpenClaw, test Hermes, or run both.

For OpenClaw itself, the signal is sharper. The ecosystem is now mature enough that migration UX is part of the product surface.
