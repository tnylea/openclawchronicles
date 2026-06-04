---
title: "SmolVM: Run OpenClaw Pi Agents in Parallel microVM Sandboxes"
excerpt: "SmolVM is an open-source microVM abstraction for coding agents that lets you run parallel Pi agents in isolated sandboxes — lighter than Docker."
coverImage: '/assets/images/posts/openclaw-smolvm-microvm-agent-sandboxes.webp'
date: '2026-05-04T14:00:00.000Z'
dateFormatted: May 4th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-smolvm-microvm-agent-sandboxes.webp'
---

A project called [SmolVM](https://github.com/CelestoAI/SmolVM/) surfaced on Hacker News yesterday with a straightforward pitch: give coding agents and OpenClaw proper microVM isolation without the weight of Docker. Built by [@theaniketmaurya](https://github.com/theaniketmaurya) at [CelestoAI](https://celesto.ai), it's already picking up interest from people running parallel agent workflows.

## What SmolVM Does

SmolVM is an open-source abstraction layer over microVMs, purpose-built for creating sandboxes for coding agents. The pitch is simple: when you're running multiple OpenClaw Pi agents in parallel, you want each one isolated, fast to start, and as lightweight as possible. Docker gets the job done but brings overhead — image layers, daemon startup, container networking — that adds up fast when you're spinning up dozens of sandboxes.

MicroVMs (think Firecracker, the tech behind AWS Lambda) boot in milliseconds, use kernel-level isolation, and have a much smaller attack surface than a full container runtime. SmolVM wraps this in a simple CLI aimed directly at agent workflows.

## The OpenClaw Angle

OpenClaw already supports sandboxed execution for agentic runtimes — the coding-agent skill spawns subprocesses and containers to let agents work without touching your host system. SmolVM offers a tighter alternative: true VM isolation per agent, at near-container startup speeds.

For anyone running a local OpenClaw setup with Pi agents doing parallel coding tasks, SmolVM could meaningfully reduce overhead while improving isolation. Each Pi agent gets its own microVM boundary — no shared process space, no Docker layer caching concerns, no daemon to keep healthy.

The ability to run **parallel Pi agents on a local sandbox** is the headline use case. If you've ever had Pi agents clobber each other's working directories or leave behind conflicting state, VM-level isolation solves that cleanly.

## Getting Started

Install SmolVM with a single command:

```bash
curl -sSL https://celesto.ai/install.sh | bash
```

Then start a Pi agent sandbox:

```bash
smolvm pi start
```

That's it. The abstraction handles the microVM lifecycle, mounts, and networking. You get an isolated Pi agent environment without configuring anything at the hypervisor level.

## Why It Matters

The tension between isolation and overhead is real for anyone running agent-heavy workflows. Docker became the default because it's good enough and well-understood. But "good enough" has a cost:

- Docker daemon adds ~100MB+ memory baseline before you run anything
- Container startup involves layer extraction and network setup
- Shared kernel namespaces mean containers aren't true VM-level isolation
- Running 10+ parallel agent containers on a laptop starts to feel it

MicroVMs flip the equation: VM-level isolation, ~50ms boot time, minimal memory footprint per instance. The tradeoff is less ecosystem tooling — you can't just `docker pull` an image — but for purpose-built agent sandboxes, SmolVM's curated environment is enough.

For OpenClaw users specifically, the `smolvm pi start` workflow maps cleanly onto the existing Pi agent model. You're not changing how you write tasks or prompts — you're just changing what the sandbox underneath looks like.

## Community and Status

SmolVM is early-stage — the GitHub repo is active and the HN thread generated solid discussion about the microVM-vs-Docker tradeoff. [@theaniketmaurya](https://github.com/theaniketmaurya) has been responsive to questions about roadmap and integration.

If you're running parallel OpenClaw agents and hitting the edges of what Docker handles comfortably, it's worth a look.

- **GitHub**: [CelestoAI/SmolVM](https://github.com/CelestoAI/SmolVM/)
- **HN Thread**: [news.ycombinator.com/item?id=47992937](https://news.ycombinator.com/item?id=47992937)
- **Install**: `curl -sSL https://celesto.ai/install.sh | bash`
