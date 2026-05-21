---
title: "OpenClaw May 21 Community: Org Shakeup, Proof Loop Skill, and More"
excerpt: "Pi harness creator exits OpenClaw's GitHub org, a new Proof Loop skill lands for agent task verification, and a Slack sandbox setup guide surfaces on HN."
coverImage: '/assets/images/posts/openclaw-2026-5-21-community-roundup.png'
date: '2026-05-21T23:00:00.000Z'
dateFormatted: May 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-21-community-roundup.png'
---

A busy Thursday in the OpenClaw community. Here's a quick sweep of what surfaced today.

## Pi Creator Exits OpenClaw's GitHub Organization

A story posted to Hacker News this morning linked to a tweet from `@badlogicgames` confirming that the creator of the Pi agent harness has been **removed from OpenClaw's GitHub organization**. The post generated minimal HN comment activity, but the organizational signal is real — Pi has been one of OpenClaw's most-used bundled harnesses, and any shift in its maintainer status is worth watching.

No formal announcement has been made on the OpenClaw side as of press time. The Pi harness remains available and functional in the current release. We'll update if there's an official statement.

**Source:** [HN thread](https://news.ycombinator.com/item?id=48220368)

## Show HN: Proof Loop — Make Your Agents Prove They Finished

`@LeoStehlik` posted a new tool and matching OpenClaw skill today: **[Proof Loop](https://github.com/LeoStehlik/proof-loop)**, a lightweight protocol helper for AI agent task verification.

The pitch is simple: coding agents often claim completion when they haven't actually finished. Proof Loop addresses this by:

- Requiring **acceptance criteria** to be defined before coding begins
- Keeping **builder and verifier roles separate**
- Marking each criterion as `PASS`, `FAIL`, or `UNKNOWN` with attached evidence
- Storing proof bundles in the repo so the *next* agent run can inspect prior state

An OpenClaw skill version is installable directly:

```bash
openclaw skills install proof-loop
```

The underlying library is harness-agnostic (works with Codex, Claude Code, OpenCode), MIT licensed, and free. The creator is specifically looking for feedback from anyone running long multi-step agent tasks.

**Source:** [HN: Show HN — Proof Loop](https://news.ycombinator.com/item?id=48224992) · [GitHub](https://github.com/LeoStehlik/proof-loop)

## Setting Up OpenClaw with Slack in a Sandbox

A new tutorial from the Superserve team — [Setting Up OpenClaw with Slack in a Sandbox](https://www.superserve.ai/blog/openclaw-setup/) — surfaced on HN today. It's a practical walkthrough covering isolated Slack workspace configuration for OpenClaw deployments. Useful if you're spinning up a sandboxed environment for testing before connecting your main workspace.

**Source:** [HN thread](https://news.ycombinator.com/item?id=48222369)

---

More tomorrow. The v2026.5.20 release and the ARC-AGI-3 leaderboard story have their own dedicated posts if you want the deeper dives.
