---
title: "AgentPort Adds 2FA to OpenClaw Agent Integrations"
excerpt: "AgentPort is a new open-source gateway that lets OpenClaw agents auto-approve safe operations while requiring human sign-off before any destructive action."
coverImage: '/assets/images/posts/openclaw-2026-4-28-agentport-permissions-gateway.webp'
date: '2026-04-28T23:05:00.000Z'
dateFormatted: April 28th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-28-agentport-permissions-gateway.webp'
---

## The Problem: All or Nothing

Most OpenClaw users face an uncomfortable binary when connecting their agent to real services. Connect everything — Gmail, GitHub, Stripe, Linear — and reap real productivity benefits while accepting that a hallucination or prompt injection could cause serious damage. Or connect nothing and stay safe, but give up most of what makes an autonomous agent useful.

yakkomajuri, the developer behind last week's widely-read [Turkey Problem essay](https://yakko.dev/blog/the-openclaw-turkey-problem), launched [AgentPort](https://github.com/yakkomajuri/agentport) today on Hacker News to address exactly this tension. The premise is simple: you should be able to let your agent work autonomously on safe operations while keeping a human in the loop for anything that could cause irreversible harm.

## How AgentPort Works

AgentPort sits between your OpenClaw agent and any integrated service as an MCP-compatible gateway. For each integration and each operation, you configure one of three permission modes:

- **Auto-approve** — safe, read-only operations run without interruption (`list_customers`, `get_invoice`, `search_email`)
- **Ask for approval** — destructive or sensitive operations are paused and you receive an approval link with the exact parameters the agent wants to use (`create_refund(customer_id: 1234, amount: 12.00)`)
- **Never allow** — a hard block for any operation you never want an agent to invoke, regardless of context

The approval flow is the key innovation: rather than a generic "agent wants to do something" notification, you see the specific function call with specific parameters and can approve or deny that exact action.

## Credential Isolation

A second protection layer sits underneath the permission model: OpenClaw agents connected through AgentPort never see your raw API keys. The gateway handles credential management separately from the agent context. This defends against credential exfiltration via prompt injection — if an adversarial document convinces your agent to leak its environment, there are no keys to leak.

The author compares it to Composio in terms of integration coverage, but with granular per-operation permissions and a fully self-hosted, open-source architecture.

## Context: The Production Database Incident

The launch post references a recent HN thread that went wide in the OpenClaw community — ["An AI agent deleted our production database. The agent's confession is below"](https://news.ycombinator.com/item?id=47911524) — as evidence that the risks are real and not hypothetical. yakkomajuri has been writing about this problem space since the Turkey Problem piece, and AgentPort is his practical answer: a tool that enables more autonomous operation without requiring blind trust.

## Getting Started

The repository is at [github.com/yakkomajuri/agentport](https://github.com/yakkomajuri/agentport). You can spin up a local instance with Docker Compose in minutes, or use the one-liner installer to deploy a production instance with automatic TLS. The project is MIT-licensed and designed to keep all credentials and operation logs on your own infrastructure.

Agents connect via MCP or CLI, making integration straightforward for existing OpenClaw setups. More detailed setup instructions are in the repo README.
