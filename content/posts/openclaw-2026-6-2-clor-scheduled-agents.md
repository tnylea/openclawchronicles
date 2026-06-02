---
title: "Clor Brings Cron-Style Automation to OpenClaw Agents"
excerpt: "Clor is a new CLI that lets coding agents create scheduled background tasks called claws, bringing cron-style automation to any OpenClaw-style setup."
coverImage: '/assets/images/posts/openclaw-2026-6-2-clor-scheduled-agents.png'
date: '2026-06-02T23:10:00.000Z'
dateFormatted: June 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-2-clor-scheduled-agents.png'
---

## Claws for Your Agent: What Clor Does

A new Show HN from Jacob Gold is making the rounds: [Clor](https://clor.com/), a CLI that gives coding agents the ability to create persistent, scheduled background tasks called "claws."

The pitch is concise: anything you can ask your agent to do once, a claw can do repeatedly — in the background, on a schedule, without you lifting a finger. Gold spent a year building an agentic coding platform at his last job, experimented with OpenClaw and Hermes, and ultimately concluded that coding agents themselves — given the right environment and tools — were the most capable automation substrate. Clor is the scheduling layer he wished had existed.

The Show HN landed today with [8 points](https://news.ycombinator.com/item?id=48375347).

## How Claws Work

Each claw is defined in a single `CLAW.md` file containing metadata (name, schedule, personality) and one or more ordered tasks. Tasks can be full agent runs with complete tool use, or plain bash steps. The format is human-readable, shareable, and importable.

Once installed, you interact with claws through your existing agent:

- `/claws` in Claude Code
- `$claws` in Codex

The scheduling daemon runs on Linux, macOS, or any VM. The install is a single shell command:

```bash
curl -fsSL https://clor.com/install.sh | bash
```

## What Claws Can Automate

Clor ships with a library of pre-built claws at [clor.com/claws](https://clor.com/claws). A sampling:

- **Dependency CVE watch** — scans GHSA, OSV, and NVD every morning for advisories hitting your declared dependencies; emails a digest only when something new lands
- **License relicense watch** — catches permissive-to-restrictive relicense moves (MIT → BSL, SSPL, AGPL) and explains the commercial impact
- **Competitor pricing diff** — monitors pricing pages and flags every material change
- **Vendor status watch** — checks your stack vendors' status pages every 15 minutes, suppresses irrelevant incidents, hands you a pre-written customer acknowledgment when something matters
- **Audio briefing** — pulls your reading list and generates a spoken daily briefing via ElevenLabs text-to-speech
- **Changelog publisher** — turns merged PRs and release tags into a polished, deployed changelog site

## A Broader Toolkit

Beyond scheduling, Clor equips claws (and the primary agent) with tools that reach outside the repository:

- Route each task to the smallest, fastest, or cheapest model that fits
- Search the web, scrape pages, capture screenshots, crawl entire sites
- Read and send email via any IMAP/SMTP mailbox
- Store files in a cloud drive that follows the agent across machines
- Pass secrets through an encrypted secrets store
- Generate images, speech, and transcripts across GPT, Gemini, and ElevenLabs

## The OpenClaw Connection

Gold explicitly tested OpenClaw before building Clor. His assessment — that OpenClaw "failed more often than not" for real work and that the security model "worried him" — positions Clor as a distinct take rather than a direct fork or complement. Where OpenClaw emphasizes a persistent always-on assistant with rich channel integrations, Clor leans into the coding agent workflow: describe what you want, let the agent build and run the claw, manage it through the same interface you already use.

For OpenClaw users who find the scheduling and cron story underdeveloped, Clor is worth evaluating. The CLAW.md format keeps automation portable and auditable. The library approach — shareable, versioned, single-file task definitions — maps well onto how most OpenClaw operators already think about skills.

Whether Clor grows into a full ecosystem of its own or becomes a pattern that influences OpenClaw's native cron implementation, the underlying insight is solid: cron has worked for decades. Coding agents are just a smarter shell.
