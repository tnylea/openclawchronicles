---
title: "Two OpenClaw Agents Closed a YC SAFE in 45 Seconds Using APOA"
excerpt: "Developer Juan Figuera built Agentic Power of Attorney as an OpenClaw skill — giving agents cryptographically-signed authority limits instead of prompt-based trust."
coverImage: '/assets/images/posts/openclaw-agents-negotiate-yc-safe-apoa.png'
date: '2026-05-07T23:00:00.000Z'
dateFormatted: May 7th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-agents-negotiate-yc-safe-apoa.png'
---

"System prompt and vibes. That's what stands between your AI agent and doing something you never authorized."

That phrase, from developer [Juan Figuera](https://www.juanfiguera.com/notes/system-prompt-and-vibes/), landed on Hacker News this afternoon and hit immediately. Figuera built **APOA** — Agentic Power of Attorney — as an OpenClaw skill after giving an agent real credentials and realizing ten minutes in that he had no cryptographic guarantee it would stay in bounds.

## The Problem APOA Is Solving

Figuera points to two recent data points that crystallize why this matters right now. Anthropic's Project Deal gave 69 employees AI agents with real money to negotiate a Slack marketplace — 186 deals closed without any human sign-off. Stanford ran a study where a buyer told their agent to stay under $500 for an iPhone; the agent spent $900 and thought it nailed the brief.

The root issue: agent authority is expressed in natural language, which is prompt-injectable and inherently vague. APOA moves the boundaries out of the prompt and into the execution layer.

## How It Works

An APOA token specifies: who the principal is, what the agent can do, what it cannot do, an expiration, and a scope. Constraint types are intentionally generic — `range`, `minimum`, `maximum`, `enum`, `required_bool` — making the same engine applicable to email management, vendor contracts, lease renewals, or anything with negotiable parameters.

The token is signed with Ed25519. The LLM never sees the constraint check. As Figuera puts it: "If the LLM had to 'decide' to check the constraints, a prompt injection could say 'skip the check.' The LLM can't bypass a gate it doesn't know about."

This mirrors the pattern Claude Code uses (the harness enforces, not the model) and the pattern MCP uses (the server validates, not the model). APOA formalizes that enforcement layer and makes it user-configurable and auditable.

## The SAFE Demo

To stress-test APOA, Figuera ran a live deal: his friend Praful was raising a SAFE for his startup. Two OpenClaw agents, on separate machines, both connected via Telegram. Each operator set their signed mandate — valuation cap range, discount terms, pro-rata rights — and the agents negotiated in a shared group chat.

Convergence took about 45 seconds. Figuera implemented a [Rubinstein alternating-offers protocol](https://en.wikipedia.org/wiki/Rubinstein_bargaining_model) (Econometrica, 1982), a game-theory framework for bilateral bargaining that guarantees convergence to a unique equilibrium under time pressure. The agents make concessions where they have room and hold firm where they don't. If either agent tries to agree to something outside its signed mandate, the protocol rejects the offer before it reaches the other side.

Every offer, counteroffer, and concession was logged to a tamper-proof audit trail via [sshsign](https://sshsign.dev). When the agents converged, both humans received private signing links in their DMs — never in the shared group chat — and an executed SAFE was produced with the full negotiation transcript and cryptographic audit trail attached.

## As an OpenClaw Skill

The implementation lives on [agenticpoa.com](https://agenticpoa.com) and ships as an OpenClaw skill. The schema Figuera used for the SAFE negotiation is one instance of a generic engine. The same constraint types — ranges, enums, required booleans — apply to any domain where an agent acts on a principal's behalf with bounded authority.

The honest limitation Figuera flags: for services that don't support APOA natively (currently all of them), enforcement happens at the agent framework layer. It stops a rogue LLM. It doesn't stop a compromised framework. Service-side enforcement closes that gap but requires adoption.

## Why This Matters

The framing of "system prompt and vibes" is a useful way to think about the current state of agent trust. Natural language constraints are prompt-injectable, auditing them after the fact is hard, and the model itself is being asked to police its own behavior. Cryptographic authority — signed tokens, execution-layer enforcement, audit trails — is a more tractable foundation.

The SAFE demo is narrow by design (two agents, numerical parameters, clean bilateral structure). Real negotiations involve multi-party dynamics and non-quantifiable terms. But the principle extends: if an agent is acting on your behalf and the stakes are real, the constraints should be cryptographic, not linguistic.

The [full write-up](https://www.juanfiguera.com/notes/system-prompt-and-vibes/) is worth reading.
