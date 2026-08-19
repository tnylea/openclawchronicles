---
title: "OpenClaw Adds Custodian-Only Skill Library"
excerpt: "OpenClaw now ships custodian-only operational skills for channel setup, model providers, Gateway diagnosis, and cloud images."
coverImage: '/assets/images/posts/openclaw-2026-8-19-custodian-skill-library.png'
date: '2026-08-19T08:02:00.000Z'
dateFormatted: August 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-19-custodian-skill-library.png'
---

OpenClaw merged the first wave of a custodian-only operational skill library in [PR #126186](https://github.com/openclaw/openclaw/pull/126186), giving system custodian agents versioned playbooks for common setup and repair work without exposing those playbooks to ordinary agents.

The problem is familiar to anyone operating a flexible agent system: configuration knowledge often lives in docs, tickets, and trial-and-error. A custodian agent may be asked to configure a channel or add a model provider, but without executable product knowledge it can drift into unsafe shortcuts or incomplete proof.

OpenClaw's new approach is to ship a separate bundled skill source, `openclaw-custodian`, that is visible only to the configured system agent.

## What Changed

The new source loads from `custodian-skills/` inside the package and is gated to the agent resolved by `agents.defaults.systemAgent.agentId`. In a single-agent install, OpenClaw can treat the sole agent as the system agent. In a multi-agent roster without an explicit system agent, no agent receives the library.

For regular agents, the source is absent. The PR says it is not listed, not disabled, and not shown in snapshots, slash-command catalogs, or model-facing skill prompts.

The first four skills are:

- `configure-channel`
- `add-model-provider`
- `diagnose-gateway`
- `cloud-image-bake`

Each follows a fixed Gather, Mutate, Repair, Prove, Report skeleton. The guardrails are the real story: secrets must stay in SecretRefs or credential stores, mutations go through canonical custodian config flows, and every run ends with an observable outcome or an explicit blocker report.

## Why It Matters

Operational agents need different knowledge than day-to-day chat agents. A normal assistant should not have privileged setup workflows in its prompt just because those workflows are bundled with the product.

The custodian-only source gives OpenClaw a cleaner split. Operators can give the system agent a disciplined setup library while keeping ordinary agents' prompts smaller and less privileged.

The live A/B test in the PR is especially telling. With the skill, the custodian proved model setup through OpenClaw's gateway path and kept the API key in SecretRef machinery. Without the skill, the agent reached a superficially correct outcome faster but proved it with a raw API call against a different model, bypassing the product path it was supposed to verify.

That is exactly the sort of difference that matters in operations: speed is less important than proving the right thing.

## User Impact

Operators with a configured custodian agent can ask it to configure channels, add providers, diagnose Gateway issues, or bake cloud-worker images using release-versioned playbooks. Regular agents should see no change.

There are no new config keys in this PR. The gating uses the existing system-agent resolution path and fails closed when agent identity is unavailable.

## Evidence From The PR

The PR reports 14/14 focused skill snapshot tests, a clean build, npm dry-run packaging that ships the four custodian skills alongside 51 bundled skills, and a live isolated Gateway test with two agents.

In that live test, only the `ops` custodian agent saw the four skills. The custodian configured OpenAI through a file-backed SecretRef provider and proved live inference through the gateway. The PR says no key material appeared in the session transcript, gateway log, or turn output.
