---
title: "OpenClaw Mainctrl Adds Runtime Tool Guards"
excerpt: "The new Mainctrl ClawHub skill gives OpenClaw operators a runtime switch for blocking destructive tools on selected agents."
coverImage: '/assets/images/posts/openclaw-2026-6-21-mainctrl-clawhub-tool-guard.png'
date: '2026-06-21T08:02:00.000Z'
dateFormatted: June 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-21-mainctrl-clawhub-tool-guard.png'
---

A new ClawHub skill called [mainctrl](https://clawhub.ai/ifeel-is-a-mouse/mainctrl) landed this morning with a practical safety goal: let OpenClaw operators toggle destructive tool access for selected agents at runtime.

The skill was published by iFeel and is currently at version `1.0.2`. Its description says it manages OpenClaw agent tool-call permissions through a runtime plugin hook that intercepts write, edit, exec, process, and apply_patch operations from controlled agents.

## What Mainctrl Does

Mainctrl is built around a companion OpenClaw plugin. The plugin listens on `before_tool_call`, checks whether the caller is in the configured `controlledAgents` list, and blocks selected tools when safety is on.

The default blocked tools are the ones operators usually worry about:

- `write` for file creation and overwrite.
- `edit` for in-place file changes.
- `exec` for shell commands.
- `process` for background process management.
- `apply_patch` for patching files.

Agents outside the controlled list are not affected. That design lets a main agent be constrained while a delegated sub-agent can still do the implementation work, assuming the operator wants that separation.

## Why It Is Different From Static Deny Lists

The interesting part is that mainctrl is runtime-controlled. The skill argues that static `tools.deny` rules require config edits and gateway restarts, while a plugin can read a local `state.json` file on each tool call.

That gives operators a fast switch:

- Turn blocking on or off without changing agent config.
- Change which agents are controlled.
- Change which tools are blocked.
- Keep sub-agents or specialist agents outside the restriction set.

The included `mainctrl.sh` script exposes commands for status, on, off, controlled-agent selection, blocked-tool selection, plugin install, and plugin removal.

## The Delegation Model

Mainctrl also includes an opinionated agent behavior rule. When a controlled agent is blocked, the skill tells it to inform the user briefly and immediately delegate the work to a sub-agent such as coder, tester, auditor, or publicist.

That makes the skill more than a raw deny mechanism. It is trying to enforce a workflow where the main agent becomes a coordinator and destructive work moves to a role that the operator has allowed to use those tools.

This is a pattern worth watching. The OpenClaw ecosystem has seen growing interest in runtime policy, audit trails, and human approval boundaries. Mainctrl takes a direct route: keep the policy local, make the switch immediate, and force a delegation habit when an agent hits the guardrail.

## Who Should Look At It

Mainctrl is best suited for operators who already run multi-agent OpenClaw setups and want a simple local control plane for tool access. It is especially relevant for teams experimenting with "main agent coordinates, sub-agents execute" workflows.

The skill is not a replacement for full sandboxing, code review, or least-privilege system design. It is a local runtime guard for a specific class of tool calls. But that narrow scope is also its appeal: it gives OpenClaw builders a concrete, inspectable way to change agent permissions while the system is running.
