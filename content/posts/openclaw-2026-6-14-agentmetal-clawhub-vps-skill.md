---
title: "OpenClaw AgentMetal Skill Adds x402 VPS Leasing Path"
excerpt: "OpenClaw AgentMetal is a new ClawHub skill for renting short-lived VPSes over x402 payments, giving agents an auditable infra path without signup or dashboards."
coverImage: '/assets/images/posts/openclaw-2026-6-14-agentmetal-clawhub-vps-skill.png'
date: '2026-06-14T23:01:00.000Z'
dateFormatted: June 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-14-agentmetal-clawhub-vps-skill.png'
---

ClawHub picked up a new infrastructure-focused skill tonight: [AgentMetal](https://clawhub.ai/luiscosio/agentmetal), a version `0.1.0` package from Luis Cosio that teaches an OpenClaw agent how to provision a Linux server through AgentMetal's API.

The interesting part is not just that it rents a VPS. It is the control shape. AgentMetal is built around HTTP 402 and x402 payments, so an agent can discover the payment requirement, satisfy it with USDC on Base, and receive a running server with SSH details in the response. The [AgentMetal site](https://agentmetal.dev/) describes the pitch as infrastructure an agent can use itself, with no signup, API key, or dashboard required for the purchase path.

That is a clean fit for OpenClaw's skill ecosystem. A skill that can deploy compute is powerful, but it also needs to be legible. AgentMetal's ClawHub listing ships with a full skill description, explicit operations, and setup notes instead of hiding the payment and provisioning flow behind vague automation.

## How the Flow Works

The [AgentMetal llms.txt](https://api.agentmetal.dev/llms.txt) lays out a two-step flow. First, the agent sends a server request without payment. The API replies with HTTP 402 and a payment requirement. Then the agent signs the requirement, resends the same request with an `X-PAYMENT` header, and receives server details if the payment clears.

The core server operations are straightforward:

- `POST /v1/servers` provisions a server.
- `GET /v1/servers/{id}` checks status.
- `POST /v1/servers/{id}/extend` renews a lease.
- `POST /v1/servers/{id}/bandwidth` buys extra egress.
- `DELETE /v1/servers/{id}` destroys a server early when an account key is available.

The current AgentMetal llms.txt lists prepaid daily plans from one to 30 days: `nano` with 2 vCPU, 2 GB RAM, and 40 GB storage at $0.70 per day; `small` with 3 vCPU, 4 GB RAM, and 80 GB storage at $1.30 per day; and `medium` with 4 vCPU, 8 GB RAM, and 160 GB storage at $2.40 per day. The same page says every server includes 20 TB per month of egress, with extra bandwidth available separately.

## Why It Matters for Agents

Most OpenClaw skills call tools that already exist in the user's environment. AgentMetal points at a different pattern: the agent can acquire a temporary environment as part of the task.

That could matter for disposable test boxes, short-lived staging servers, build runners, isolated scraping jobs, or experiments where the user does not want to provision a cloud account manually. It also pairs naturally with OpenClaw's cron and taskflow model. A scheduled task that needs clean compute could lease it, run the work, store the result, and let the server expire.

There are obvious reasons to move carefully. Payment-enabled infrastructure skills need tight budgets, visible receipts, lifecycle cleanup, and clear human approval boundaries. A server that expires automatically is safer than one that silently lives forever, but agents still need policies around who can pay, how much they can spend, and when they can destroy or renew infrastructure.

## ClawHub as the Distribution Layer

The ClawHub listing is also useful as a signal for where the OpenClaw ecosystem is going. AgentMetal is not just a script pasted into a README. It is published as a reusable skill with a description, changelog, version, owner, and license metadata. There is also a related GitHub repository, [agentmetal/agents](https://github.com/agentmetal/agents), describing AgentMetal skills and plugin support for Claude, Hermes, and OpenClaw.

That distribution layer matters because infrastructure skills need provenance. Operators should be able to inspect what a skill claims to do, where it sends requests, what environment variables it expects, and what external cost surface it opens.

AgentMetal is early, with version `0.1.0` and no install/download history yet. But the concept is notable: a ClawHub skill that gives an agent a payment-gated path to fresh compute, with the API documented for both humans and models.

## What to Watch Next

The next question is not whether an agent can rent a server. AgentMetal says yes. The better question is how OpenClaw users wrap that capability in policy.

Expect the useful patterns to look conservative: capped wallets, short leases, explicit approval before payment, automatic status checks, and task-specific cleanup. If those patterns become easy to express, infrastructure-on-demand skills could become a practical part of agent workflows rather than a novelty.

Read the skill on ClawHub: [AgentMetal](https://clawhub.ai/luiscosio/agentmetal). Read the agent-facing API manual: [AgentMetal llms.txt](https://api.agentmetal.dev/llms.txt).
