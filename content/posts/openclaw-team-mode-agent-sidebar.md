---
title: "OpenClaw Adds Team Mode Agent Sidebar"
excerpt: "OpenClaw's new team mode sidebar shows every agent and its sessions together, making multi-agent work easier to scan."
coverImage: '/assets/images/posts/openclaw-team-mode-agent-sidebar.png'
date: '2026-09-12T08:01:00.000Z'
dateFormatted: September 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-team-mode-agent-sidebar.png'
---

OpenClaw's Control UI gained a major multi-agent navigation upgrade this morning with [PR #141476](https://github.com/openclaw/openclaw/pull/141476), titled `feat(ui): team mode shows every agent and its sessions in the sidebar`.

This is an opt-in sidebar mode for users who run OpenClaw as a real team of agents instead of a single assistant with occasional alternates. The previous sidebar centered one selected agent. Other agents lived behind the switcher, and shared pages such as Automations, Tasks, Sessions, Usage, and Dashboards were scoped one agent at a time.

Team mode makes the roster the primary object. The agent chip becomes a workspace header, every selectable agent gets a collapsible group, and each agent's sessions sit underneath it using the existing row, tree, menu, and pagination behavior.

## What Team Mode Shows

The PR describes a sidebar built for scanning agent activity, not just switching identity. In team mode, OpenClaw shows:

- Agent groups in configured order, so activity does not constantly reshuffle the team.
- Nested pinned and recent sessions below each agent.
- Per-agent main-chat entry points.
- Per-agent actions for new conversations, all sessions, and collapsing other groups.
- Shared pages defaulting to all agents, with identity chips on rows.

The old single-agent layout remains available. Users can turn team mode on from the agent switcher with "Show all agents" and return with "Show one agent" from the workspace header menu.

## Why This Matters

OpenClaw has been steadily moving from one assistant in one chat toward a richer agent workspace. Once you have several specialized agents, a one-agent sidebar becomes a bottleneck. You can have a coding agent running, a personal assistant idle, a research agent with unread output, and a background automation that needs attention, but the old navigation model made that state feel scattered.

Team mode pulls those signals into one place. The PR keeps current sessions visible, keeps group collapse separate from navigation, and uses shared activity data bounded to 300 recent sessions per Gateway. It also preserves single-agent pages such as Skill Workshop, model providers, and memory settings by preselecting the relevant agent when reached from a group header.

## Design Details Worth Noting

The visual work is specific. Agent headers use 36px avatars and 48px rows. Child sessions use 32px rows and indent under the agent. The right side only reserves space when an indicator exists, such as unread, working, needs-input, error, or a collapsed child count.

Default avatars also become consistent across surfaces: identity image first, then emoji, then a deterministic generated face, with the system agent keeping the OpenClaw mark.

That sounds cosmetic, but it is part of the usefulness. Multi-agent UI gets messy quickly if every surface has a different identity rule. This patch gives the roster and shared pages the same visual language.

## Bottom Line

Team mode is one of the clearest signs that OpenClaw is treating multi-agent work as a first-class daily workflow. For solo installs, nothing has to change. For teams of agents, the sidebar should now answer the basic question faster: who is working, where, and what needs attention?
