---
title: "Clawcenter: Open-Source Mission Control for OpenClaw Agents"
excerpt: "Clawcenter is a new open-source local UI that gives OpenClaw operators one place to manage agent org charts, skills, schedules, and production activity logs."
coverImage: '/assets/images/posts/openclaw-2026-4-25-clawcenter-mission-control.webp'
date: '2026-04-25T23:05:00.000Z'
dateFormatted: April 25th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-25-clawcenter-mission-control.webp'
---

A new community project called **Clawcenter** showed up on Hacker News today, and it's worth a look if you're running more than a couple of OpenClaw agents and find yourself constantly jumping between config files, terminal sessions, and scattered markdown.

[Clawcenter](https://github.com/borjasolerme/Clawcenter) is a local-first, open-source control plane built on Next.js. It reads your existing `~/.openclaw` workspace and presents everything through a clean web UI at `localhost:3030`. No cloud, no accounts, no telemetry — your agent logs don't leave the machine.

## What It Does

The project is explicitly minimal, which is part of its appeal. Rather than trying to replace OpenClaw's full Mission Control, it fills a specific gap: making the operational side of running multiple agents less painful.

Key features:

- **Agent org chart** — visualize agent hierarchy with draggable positions and saved reporting lines. Useful when you have agents spanning Slack, Telegram, scheduled jobs, and skills.
- **Agent identity editor** — edit names, roles, descriptions, and operating style from a UI rather than opening markdown files by hand.
- **Skill browser** — browse installed skills and edit their markdown files directly from Clawcenter. No more hunting for the right path in `~/.openclaw/workspace/skills/`.
- **Core file editor** — edit `SOUL.md`, `TOOLS.md`, `MEMORY.md`, and `HEARTBEAT.md` with backup-on-save so changes are recoverable.
- **Heartbeat and cron manager** — control job schedules without touching the CLI directly.
- **Production activity feed** — built from local OpenClaw task history, session history, command metadata, and workspace memory files. Formatted as readable production logs rather than raw command metadata dumps.

Light and dark mode are included. The layout is responsive for desktop and mobile.

## Why It Exists

The author ([borjasolerme](https://github.com/borjasolerme)) explains the motivation clearly in the repo: OpenClaw's built-in Mission Control is functional, but editing installed skills and organizing many agents gets friction-heavy, and the existing interface can feel overloaded. Clawcenter is the minimal slice of that — the operational day-to-day without the full feature surface.

It's also a practical demonstration that the OpenClaw workspace is structured well enough to build external tooling on top of. The app uses Next.js server routes to read and write `~/.openclaw` state directly, which keeps the architecture simple and local.

## Getting Started

Requirements: Node.js 22+, OpenClaw installed and available as `openclaw` on your PATH, and an existing `~/.openclaw` workspace.

```bash
git clone https://github.com/borjasolerme/Clawcenter.git
cd Clawcenter
npm install
npm run dev
# → http://localhost:3030
```

If your OpenClaw config lives somewhere non-standard:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw.json npm run dev
```

The project is marked "onwork" (in progress) in the repo description, so expect rough edges. Cron listing and mutations require the OpenClaw gateway scheduler to be reachable. File writes create timestamped backups before saving, which is the kind of defensive default that makes early tooling safer to use on real configs.

## Worth Watching

Clawcenter is early, but the problem it's solving is real. The more agents you run, the more the lack of a unified operational view becomes a pain point. Whether this specific project matures or gets absorbed into something broader, the demand it's responding to is going to keep growing as OpenClaw deployments get more complex.

If you try it, the repo is [github.com/borjasolerme/Clawcenter](https://github.com/borjasolerme/Clawcenter). The HN thread is sparse so far but worth watching if the project picks up traction.
