---
title: "OpenClaw Auto Mode Brings Smarter Exec Approvals Without the YOLO"
excerpt: "OpenClaw's new opt-in auto exec mode uses a reviewer model to evaluate missed approvals before escalating to humans—safer than ask, smarter than YOLO."
coverImage: '/assets/images/posts/openclaw-2026-5-31-auto-exec-approvals.webp'
date: '2026-05-31T23:00:00.000Z'
dateFormatted: May 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-31-auto-exec-approvals.webp'
---

The OpenClaw team published a new entry on the official blog today outlining `auto` mode — a third option for host exec approvals that sits between the strict `ask` flow and the permissive `YOLO` mode. Authored by Chief Architect Vincent Koc, Core Maintainer Jesse Merhi, and OpenClaw Foundation member Josh Avant, the post details how the feature works and what prompted its development.

## Why Three Modes?

OpenClaw's host exec approval system has long offered two stances:

- **ask** — every command that misses the allowlist stops and waits for a human.
- **YOLO** — commands run without any prompts, useful only in already-trusted or externally sandboxed environments.

Both extremes have real downsides. Strict `ask` mode generates approval fatigue for busy agents. Full YOLO is appropriate for tightly controlled setups but too broad for everyday use. The new `auto` mode is designed to fill that gap, especially for Enterprise deployments that need accountability without constant interruption.

## How Auto Mode Works

When `tools.exec.mode` is set to `auto`, OpenClaw handles each host command through a three-stage flow:

1. **Allowlist check** — if the command matches a deterministic safe-bin rule or allowlist entry, it runs immediately with no prompt.
2. **Reviewer model** — if the command misses policy, OpenClaw builds a bounded review packet (command, argv, cwd, env key names, host, parser analysis) and sends it to a reviewer model. The reviewer can approve a single low-risk execution.
3. **Human fallback** — anything ambiguous, higher-risk, unparseable, or where the reviewer cannot safely say yes falls back to the human operator.

A key design choice: the reviewer model is intentionally separate from the main agent model. You can keep the agent running on a local or lightweight model for most work, and point exec review at a more capable frontier model — such as `openai/gpt-5.5` — only when a command needs approval judgment. That lets you get high-confidence reviews on exec decisions without routing every agent turn through an expensive model.

## The Codex Connection

OpenAI already ships this pattern inside Codex as its Guardian-reviewed permission preset. Through the [Codex harness](https://docs.openclaw.ai/plugins/codex-harness), OpenAI-backed OpenClaw sessions already benefit from Guardian approvals with workspace sandboxing. The new `auto` mode extends the same shape to all OpenClaw host exec configurations — regardless of which model backend you use.

## Approvals Where You Already Work

One of the more practical changes in this system: approval prompts no longer have to land in a local terminal. OpenClaw can route them into the messaging surfaces operators already watch — [Slack](https://docs.openclaw.ai/channels/slack), [Telegram](https://docs.openclaw.ai/channels/telegram), or [iMessage](https://docs.openclaw.ai/channels/imessage). If you are away from your machine when an agent requests host access, the approval can reach you through the channel you are already in.

## Turning It On

Enabling auto mode takes two commands:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.mode auto
```

If you want the reviewer to use a different model from the main agent:

```bash
openclaw config set tools.exec.reviewer.model openai/gpt-5.5
```

Leave the reviewer model unset to reuse the current agent model.

## What Stays the Same

Auto mode does not override local safety settings. A host configured to always ask still asks. A host configured to deny still denies. The reviewer is explicitly prompted to treat the command text, argv, cwd, env keys, heredocs, strings, filenames, and all metadata as untrusted data. If any of that untrusted content attempts to instruct the reviewer or steer a decision, the system defers to a human instead.

`allow-once` approvals are intentionally narrow. For node-host runs, OpenClaw binds the approval to the canonical command plan, cwd, argv, and session context. If the caller modifies the command after the approval request was created, the run is rejected rather than silently executing the changed request.

The team is testing `auto` in public before considering it a safer default for more users. YOLO mode remains available for environments that already handle sandboxing externally. For Enterprise deployments, `auto` gives you fewer prompts than strict `ask` mode and more review than full host access — with a human fallback when it counts most.

Full details are in the [exec approvals docs](https://docs.openclaw.ai/tools/exec-approvals) and the [official blog post](https://openclaw.ai/blog/safer-than-yolo-auto-mode-for-exec-approvals).
