---
title: "OpenClaw on Hetzner: NixOS Agent Servers"
excerpt: "A new community tutorial shows how NixOS and Hetzner bare metal can turn OpenClaw agent infrastructure into reviewable, rollback-friendly code."
coverImage: '/assets/images/posts/openclaw-2026-6-13-nixos-hetzner-agent-servers.png'
date: '2026-06-13T23:01:00.000Z'
dateFormatted: June 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-13-nixos-hetzner-agent-servers.png'
---

A fresh Hacker News submission is a useful reminder that OpenClaw infrastructure is starting to look less like "install an agent somewhere" and more like operations-as-code. Irakli Janiashvili's post, [Hetzner Metal + NixOS in about 15 minutes](https://iraklijani.com/blog/installing-nixos-on-hetzner-metal/), walks through setting up a dedicated NixOS box for agent workloads, then converting the workflow into reusable scripts and skills.

The HN thread is small so far, but the model is worth covering: agents propose infrastructure changes through code, humans review those changes, and the machine applies them through a declarative system configuration.

## Why This Matters for OpenClaw

OpenClaw users often start by running a gateway on a laptop, VPS, or spare machine. That is fine for experimentation, but it gets uncomfortable when agents are meant to run all day, touch real services, build containers, or coordinate work across multiple channels.

Janiashvili frames the motivation plainly: the goal was a dedicated machine for agents and AI assistants, not a daily laptop full of personal data. Hetzner bare metal provides the hardware economics; NixOS provides the reproducible system model.

The post says the first pass took about four hours, but the resulting workflow can get a new NixOS Hetzner box running in roughly 15 minutes of active setup time when things go smoothly.

## The Four-Step Flow

The tutorial breaks the setup into four reusable skill-shaped steps:

- Benchmark Hetzner locations for latency and throughput.
- Choose a server offer using opinionated filters like ECC RAM, DDR5, modern CPU, NVMe, and no setup fee.
- Install NixOS declaratively with rescue preflight, Disko layout, `nixos-anywhere`, and first-boot checks.
- Run a post-install health audit for failed units, RAID, mounts, routes, SSH, firewall, time, DNS, EFI, and SMART.

The most interesting detail is not Hetzner itself. It is the operating pattern around OpenClaw. In the HN discussion, the author explains that OpenClaw proposes changes by opening pull requests against the Nix config, while the operator reviews and merges those changes before the machine changes.

That is a clean separation of agency and authority. The agent can inspect, draft, and propose. The human can review, merge, roll back, and audit.

## Declarative Servers Fit Agent Work

NixOS is a natural match for long-running agent machines because its strengths map directly to the risk profile:

- System configuration lives in code.
- Invalid option combinations can fail before apply.
- Diffs are reviewable.
- Builds are reproducible.
- Generations make rollback a normal part of operations.

The tutorial is careful not to oversell this. Nix does not make a server impossible to break, and root can still damage anything outside the Nix store. What it does provide is a more predictable path back to a known system state.

That matters for OpenClaw because agent workloads tend to blur boundaries. A personal assistant can become a build runner, cron host, channel gateway, media generator, deployment helper, and file organizer. Without a declarative baseline, every helpful automation becomes another mutable server habit.

## The Practical Takeaway

The setup includes a separate repository, [IrakliJani/nixos-hetzner-metal](https://github.com/IrakliJani/nixos-hetzner-metal), and the article points to concrete gotchas: UEFI confusion in Hetzner's auction flow, GRUB/UEFI option mismatches, host key changes after reinstall, explicit IPv6 configuration, and local macOS `nixos-rebuild` friction.

For OpenClaw operators, the bigger lesson is architectural. If an agent is going to manage infrastructure, represent that infrastructure as code first. Give the agent a typed, reviewable surface. Let it open a pull request. Then let the system apply only what passed review.

That is a healthier default than giving a persistent agent a mutable box and hoping the logs explain what happened later.

Read the article: [I Spent 4 Hours So You Don't Have To: Hetzner Metal + NixOS in ~15 Minutes](https://iraklijani.com/blog/installing-nixos-on-hetzner-metal/). See the HN discussion: [Show HN: NixOS on Hetzner with OpenClaw in 15 Minutes](https://news.ycombinator.com/item?id=48516998).
